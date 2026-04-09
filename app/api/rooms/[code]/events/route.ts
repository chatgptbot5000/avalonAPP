import { roomStore } from "@/lib/room-store"

const encoder = new TextEncoder()
const HEARTBEAT_INTERVAL_MS = 15000

function writeVersion(version: number) {
  return encoder.encode(`data: ${JSON.stringify({ version })}\n\n`)
}

function writePing() {
  return encoder.encode("event: ping\ndata: ping\n\n")
}

export async function GET(_request: Request, { params }: { params: { code: string } }) {
  try {
    if (!roomStore.getRoom(params.code)) {
      throw new Error(`Unknown room: ${params.code}`)
    }

    let canceled = false
    let cleanup = () => {}

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const pendingVersions: number[] = []
        let initialVersion: number | null = null
        let lastSentVersion = -1

        const unsubscribe = roomStore.events.subscribe(params.code, (nextVersion) => {
          if (initialVersion === null) {
            pendingVersions.push(nextVersion)
            return
          }

          if (nextVersion > lastSentVersion) {
            lastSentVersion = nextVersion
            controller.enqueue(writeVersion(nextVersion))
          }
        })

        const { version } = roomStore.snapshot(params.code)
        initialVersion = version
        lastSentVersion = version

        controller.enqueue(writeVersion(version))

        pendingVersions.forEach((nextVersion) => {
          if (nextVersion > lastSentVersion) {
            lastSentVersion = nextVersion
            controller.enqueue(writeVersion(nextVersion))
          }
        })

        const heartbeat = setInterval(() => {
          controller.enqueue(writePing())
        }, HEARTBEAT_INTERVAL_MS)

        const abortStream = () => {
          cleanup()

          if (!canceled) {
            controller.close()
          }
        }

        let cleanedUp = false
        cleanup = () => {
          if (cleanedUp) {
            return
          }

          cleanedUp = true
          clearInterval(heartbeat)
          unsubscribe()
          _request.signal.removeEventListener("abort", abortStream)
        }

        _request.signal.addEventListener("abort", abortStream, { once: true })
      },
      cancel() {
        canceled = true
        cleanup()
      },
    })

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    const status = error instanceof Error && /unknown room/i.test(error.message) ? 404 : 500

    return Response.json({ error: message }, { status })
  }
}

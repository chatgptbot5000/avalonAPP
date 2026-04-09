import { handleRoomRoute } from "@/app/api/rooms/handle-room-route"
import { roomStore } from "@/lib/room-store"

export async function POST(request: Request, { params }: { params: { code: string } }) {
  return handleRoomRoute(async () => {
    const { sessionId, name } = await request.json()
    roomStore.joinRoom(params.code, sessionId, name)

    return {
      room: roomStore.snapshotForSession(params.code, sessionId),
    }
  })
}

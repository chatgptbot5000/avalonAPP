import { handleRoomRoute } from "@/app/api/rooms/handle-room-route"
import { roomStore } from "@/lib/room-store"

export async function POST(request: Request, { params }: { params: { code: string } }) {
  return handleRoomRoute(async () => {
    const { sessionId } = await request.json()
    roomStore.rejoinRoom(params.code, sessionId)

    return {
      room: roomStore.snapshotForSession(params.code, sessionId),
    }
  })
}

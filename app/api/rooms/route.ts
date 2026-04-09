import { handleRoomRoute } from "@/app/api/rooms/handle-room-route"
import { roomStore } from "@/lib/room-store"

export async function POST(request: Request) {
  return handleRoomRoute(async () => {
    const { sessionId, name } = await request.json()
    const room = roomStore.createRoom(sessionId, name)

    return {
      room: roomStore.snapshotForSession(room.code, sessionId),
    }
  }, 201)
}

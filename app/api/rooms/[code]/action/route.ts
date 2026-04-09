import { handleRoomRoute } from "@/app/api/rooms/handle-room-route"
import { roomStore, type RoomAction } from "@/lib/room-store"

export async function POST(request: Request, { params }: { params: { code: string } }) {
  return handleRoomRoute(async () => {
    const { sessionId, action } = (await request.json()) as { sessionId: string; action: RoomAction }
    roomStore.applyAction(params.code, sessionId, action)

    return {
      room: roomStore.snapshotForSession(params.code, sessionId),
    }
  })
}

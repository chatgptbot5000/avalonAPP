import { handleRoomRoute } from "@/app/api/rooms/handle-room-route"
import { roomStore } from "@/lib/room-store"

export async function GET(_request: Request, { params }: { params: { code: string } }) {
  return handleRoomRoute(async () => ({
    room: roomStore.snapshot(params.code),
  }))
}

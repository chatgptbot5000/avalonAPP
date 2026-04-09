import { RoomPageClient } from "@/components/room-page-client"

type RoomPageProps = {
  params: {
    code: string
  }
}

export default function RoomPage({ params }: RoomPageProps) {
  return <RoomPageClient code={params.code.toUpperCase()} />
}

import { NextResponse } from "next/server"

function getStatusForRoomError(message: string) {
  if (/unknown room|unknown session|unknown player/i.test(message)) {
    return 404
  }

  if (/already taken|already joined|already started|already voted/i.test(message)) {
    return 409
  }

  if (/only the host|only the current leader|only the assassin/i.test(message)) {
    return 403
  }

  if (/cannot |expected |duplicate|not on the quest team|good players cannot|5-10 players|unsupported player count|unsupported quest setup/i.test(message)) {
    return 400
  }

  return 500
}

export async function handleRoomRoute<T>(action: () => Promise<T>, status = 200) {
  try {
    return NextResponse.json(await action(), { status })
  } catch (error) {
    if (!(error instanceof Error)) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }

    return NextResponse.json({ error: error.message }, { status: getStatusForRoomError(error.message) })
  }
}

"use client"

import { useEffect, useState } from "react"

import { useRoomStream } from "@/hooks/use-room-stream"
import { postJson } from "@/lib/client-api"
import { getOrCreateSessionId } from "@/lib/session"

import { GameTable, type GameTableRoom } from "./game-table"

type RoomSnapshot = GameTableRoom & {
  version: number
  private: {
    role: "merlin" | "assassin" | "percival" | "morgana" | "mordred" | "oberon" | "loyal-servant" | "minion"
    privateKnowledge: { seenPlayers: string[] } | string[]
    canProposeTeam: boolean
    canVoteTeam: boolean
    canVoteQuest: boolean
    canPickMerlin: boolean
  } | null
  session: {
    playerId: string
    isHost: boolean
  } | null
}

type RoomResponse = {
  room: RoomSnapshot
}

type RoomPageClientProps = {
  code: string
}

export function parseRoomResponse(json: RoomResponse | { error?: string }) {
  if (!("room" in json)) {
    throw new Error(json.error ?? "Room payload missing from response")
  }

  return json.room
}

async function fetchRoom(code: string) {
  const response = await postJson<RoomResponse>(`/api/rooms/${code}/rejoin`, {
    sessionId: getOrCreateSessionId(),
  })

  return parseRoomResponse(response)
}

export function RoomPageClient({ code }: RoomPageClientProps) {
  const [room, setRoom] = useState<RoomSnapshot>({ code, version: 0, players: [], game: null, private: null, session: null })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const latestVersion = useRoomStream(code, room.version)

  async function applyRoomMutation<TResponse extends RoomResponse>(url: string, body: unknown) {
    setIsSubmittingAction(true)

    try {
      const response = await postJson<TResponse>(url, body)
      setRoom(parseRoomResponse(response))
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update room")
    } finally {
      setIsSubmittingAction(false)
    }
  }

  useEffect(() => {
    let canceled = false

    async function loadRoom() {
      try {
        const nextRoom = await fetchRoom(code)

        if (!canceled) {
          setRoom(nextRoom)
          setErrorMessage(null)
        }
      } catch (error) {
        if (!canceled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load room")
        }
      }
    }

    void loadRoom()

    return () => {
      canceled = true
    }
  }, [code, latestVersion])

  if (errorMessage) {
    return <p role="alert">{errorMessage}</p>
  }

  return (
    <GameTable
      room={room}
      privateView={room.private ?? null}
      session={room.session ?? null}
      isSubmittingAction={isSubmittingAction}
      onStartGame={() => applyRoomMutation(`/api/rooms/${code}/start`, { sessionId: getOrCreateSessionId() })}
      onSubmitTeam={(team) =>
        applyRoomMutation(`/api/rooms/${code}/action`, {
          sessionId: getOrCreateSessionId(),
          action: { type: "submit-team", team },
        })
      }
      onSubmitTeamVote={(vote) =>
        applyRoomMutation(`/api/rooms/${code}/action`, {
          sessionId: getOrCreateSessionId(),
          action: { type: "submit-team-vote", vote },
        })
      }
      onSubmitQuestVote={(vote) =>
        applyRoomMutation(`/api/rooms/${code}/action`, {
          sessionId: getOrCreateSessionId(),
          action: { type: "submit-quest-vote", vote },
        })
      }
      onSubmitAssassinPick={(targetPlayerId) =>
        applyRoomMutation(`/api/rooms/${code}/action`, {
          sessionId: getOrCreateSessionId(),
          action: { type: "submit-assassin-pick", targetPlayerId },
        })
      }
      onPlayAgain={() => applyRoomMutation(`/api/rooms/${code}/reset`, { sessionId: getOrCreateSessionId() })}
    />
  )
}

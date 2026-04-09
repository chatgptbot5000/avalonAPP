import { useEffect, useState } from "react"

import type { PrivateKnowledge } from "@/game/knowledge"
import type { GamePhase, Role } from "@/types/game"

const EVIL_ROLES: Role[] = ["assassin", "morgana", "mordred", "oberon", "minion"]

type RoomPlayer = {
  id: string
  name: string
  connected: boolean
}

type RoomView = {
  players: RoomPlayer[]
  game: {
    phase: GamePhase
    teamSize: number
    proposedTeam: string[]
  } | null
}

const EMPTY_ROOM: RoomView = {
  players: [],
  game: null,
}

type PrivateView = {
  role: Role
  privateKnowledge: PrivateKnowledge | string[]
  canProposeTeam: boolean
  canVoteTeam: boolean
  canVoteQuest: boolean
  canPickMerlin: boolean
} | null

type SessionView = {
  playerId: string
  isHost: boolean
} | null

type PrivateActionPanelProps = {
  room?: RoomView
  gamePhase: GamePhase
  privateView: PrivateView
  session: SessionView
  isSubmitting?: boolean
  onStartGame?: () => Promise<void>
  onSubmitTeam?: (team: string[]) => Promise<void>
  onSubmitTeamVote?: (vote: "approve" | "reject") => Promise<void>
  onSubmitQuestVote?: (vote: "success" | "fail") => Promise<void>
  onSubmitAssassinPick?: (targetPlayerId: string) => Promise<void>
}

function formatRole(role: Role) {
  return role.replace(/-/g, " ")
}

function getSeenPlayers(privateView: Exclude<PrivateView, null>) {
  return Array.isArray(privateView.privateKnowledge)
    ? privateView.privateKnowledge
    : privateView.privateKnowledge.seenPlayers
}

function getFallbackCopy(gamePhase: GamePhase) {
  if (gamePhase === "lobby") {
    return {
      title: "Waiting for the host",
      detail: "The host can review the table and start when everyone is seated.",
    }
  }

  if (gamePhase === "team-vote") {
    return {
      title: "Cast your team vote",
      detail: "Approve or reject the proposed lineup before the quest begins.",
    }
  }

  if (gamePhase === "quest-vote") {
    return {
      title: "Resolve the quest",
      detail: "Players on the mission should submit their hidden quest cards.",
    }
  }

  if (gamePhase === "assassin-pick") {
    return {
      title: "Assassin decides",
      detail: "The final move belongs to the assassin. Choose carefully.",
    }
  }

  if (gamePhase === "game-over") {
    return {
      title: "Final reveal",
      detail: "The match is over and the table can compare loyalties.",
    }
  }

  return {
    title: "Table in motion",
    detail: "Follow the roster and quest track while the current phase resolves.",
  }
}

function isGoodRole(role: Role) {
  return !EVIL_ROLES.includes(role)
}

export function PrivateActionPanel({
  room = EMPTY_ROOM,
  gamePhase,
  privateView,
  session,
  isSubmitting = false,
  onStartGame,
  onSubmitTeam,
  onSubmitTeamVote,
  onSubmitQuestVote,
  onSubmitAssassinPick,
}: PrivateActionPanelProps) {
  const fallbackCopy = getFallbackCopy(gamePhase)
  const [selectedTeam, setSelectedTeam] = useState<string[]>([])
  const [assassinTarget, setAssassinTarget] = useState("")

  useEffect(() => {
    setSelectedTeam(room.game?.proposedTeam ?? [])
  }, [room.game?.phase, room.game?.teamSize, room.players])

  useEffect(() => {
    setAssassinTarget("")
  }, [gamePhase, room.players])

  const canStart = gamePhase === "lobby" && session?.isHost && room.players.length >= 5 && room.players.length <= 10 && !!onStartGame
  const canSubmitTeam =
    gamePhase === "team-proposal" &&
    privateView?.canProposeTeam &&
    !!onSubmitTeam &&
    room.game &&
    selectedTeam.length === room.game.teamSize
  const questVoteOptions = privateView
    ? isGoodRole(privateView.role)
      ? (["success"] as const)
      : (["success", "fail"] as const)
    : []
  const assassinChoices = room.players.filter((player) => player.id !== session?.playerId)

  function toggleTeamPlayer(playerId: string) {
    setSelectedTeam((current) => {
      if (current.includes(playerId)) {
        return current.filter((entry) => entry !== playerId)
      }

      if (room.game && current.length >= room.game.teamSize) {
        return current
      }

      return [...current, playerId]
    })
  }

  return (
    <section className="panel-surface panel-inset" aria-labelledby="private-action-heading">
      <p className="eyebrow">Table Flow</p>
      <h2 id="private-action-heading">Current Action</h2>

      {canStart ? (
        <>
          <p>Everyone is seated. The host can begin the match.</p>
          <button type="button" disabled={isSubmitting} onClick={() => void onStartGame?.()}>
            Start game
          </button>
        </>
      ) : privateView?.canProposeTeam && room.game ? (
        <>
          <p>You are the current leader.</p>
          <p className="muted-copy">Choose exactly {room.game.teamSize} players for this quest.</p>
          <div>
            {room.players.map((player) => (
              <label key={player.id} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={selectedTeam.includes(player.id)}
                  disabled={
                    isSubmitting ||
                    (!selectedTeam.includes(player.id) && !!room.game && selectedTeam.length >= room.game.teamSize)
                  }
                  onChange={() => toggleTeamPlayer(player.id)}
                />{" "}
                {player.name}
              </label>
            ))}
          </div>
          <button type="button" disabled={!canSubmitTeam || isSubmitting} onClick={() => void onSubmitTeam?.(selectedTeam)}>
            Propose team
          </button>
        </>
      ) : privateView?.canVoteTeam ? (
        <>
          <p>Cast your team vote.</p>
          <div>
            <button type="button" disabled={isSubmitting} onClick={() => void onSubmitTeamVote?.("approve")}>
              Approve team
            </button>
            <button type="button" disabled={isSubmitting} onClick={() => void onSubmitTeamVote?.("reject")}>
              Reject team
            </button>
          </div>
        </>
      ) : privateView?.canVoteQuest ? (
        <>
          <p>Submit your hidden quest vote.</p>
          <div>
            {questVoteOptions.map((vote) => (
              <button key={vote} type="button" disabled={isSubmitting} onClick={() => void onSubmitQuestVote?.(vote)}>
                {vote === "success" ? "Play success" : "Play fail"}
              </button>
            ))}
          </div>
        </>
      ) : privateView?.canPickMerlin ? (
        <>
          <p>The assassin must name Merlin.</p>
          <label>
            <span className="muted-copy">Pick a target.</span>
            <select value={assassinTarget} onChange={(event) => setAssassinTarget(event.target.value)} disabled={isSubmitting}>
              <option value="">Select a player</option>
              {assassinChoices.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={isSubmitting || !assassinTarget}
            onClick={() => void onSubmitAssassinPick?.(assassinTarget)}
          >
            Confirm assassin pick
          </button>
        </>
      ) : privateView && gamePhase === "role-reveal" ? (
        <>
          <p>{`You are ${formatRole(privateView.role)}.`}</p>
          <p className="muted-copy">
            {getSeenPlayers(privateView).length > 0
              ? `You can identify ${getSeenPlayers(privateView).join(", ")}.`
              : "No extra knowledge is visible from this seat."}
          </p>
        </>
      ) : (
        <>
          <p>{fallbackCopy.title}</p>
          <p className="muted-copy">{fallbackCopy.detail}</p>
        </>
      )}
    </section>
  )
}

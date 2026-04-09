import type { PrivateKnowledge } from "@/game/knowledge"
import type { GamePhase, GameWinner, QuestOutcome, Role } from "@/types/game"

import { FinalRevealPanel } from "./final-reveal-panel"
import { LobbyPanel } from "./lobby-panel"
import { PlayerRoster } from "./player-roster"
import { PrivateActionPanel } from "./private-action-panel"
import { QuestTrack } from "./quest-track"

type RoomPlayer = {
  id: string
  name: string
  connected: boolean
}

type PublicHistoryEntry = {
  questNumber: number
  outcome: QuestOutcome
  failCount: number
}

type PublicGameView = {
  phase: GamePhase
  roundNumber: number
  questNumber: number
  leaderPlayerId: string
  teamSize: number
  proposedTeam: string[]
  publicHistory: PublicHistoryEntry[]
  winner?: GameWinner
}

type PrivateGameView = {
  role: Role
  privateKnowledge: PrivateKnowledge | string[]
  canProposeTeam: boolean
  canVoteTeam: boolean
  canVoteQuest: boolean
  canPickMerlin: boolean
}

export type GameTableRoom = {
  code: string
  players: RoomPlayer[]
  game: PublicGameView | null
}

type SessionView = {
  playerId: string
  isHost: boolean
}

type GameTableProps = {
  room: GameTableRoom
  privateView: PrivateGameView | null
  session: SessionView | null
  isSubmittingAction?: boolean
  onStartGame?: () => Promise<void>
  onSubmitTeam?: (team: string[]) => Promise<void>
  onSubmitTeamVote?: (vote: "approve" | "reject") => Promise<void>
  onSubmitQuestVote?: (vote: "success" | "fail") => Promise<void>
  onSubmitAssassinPick?: (targetPlayerId: string) => Promise<void>
}

function getSeenPlayers(privateView: PrivateGameView) {
  return Array.isArray(privateView.privateKnowledge)
    ? privateView.privateKnowledge
    : privateView.privateKnowledge.seenPlayers
}

export function GameTable({
  room,
  privateView,
  session,
  isSubmittingAction = false,
  onStartGame,
  onSubmitTeam,
  onSubmitTeamVote,
  onSubmitQuestVote,
  onSubmitAssassinPick,
}: GameTableProps) {
  return (
    <main className="room-shell">
      <header className="room-banner panel-surface">
        <div>
          <p className="eyebrow">Avalon Table</p>
          <h1>Room {room.code}</h1>
        </div>
        <p className="room-banner__meta">Desktop-first seating with a refined game-night layout.</p>
      </header>

      <section className="room-grid">
        <PlayerRoster players={room.players} leaderPlayerId={room.game?.leaderPlayerId ?? null} />

        <section className="table-stage panel-surface" aria-label="Current table state">
          <QuestTrack history={room.game?.publicHistory ?? []} currentQuest={room.game?.questNumber ?? 1} />

          <PrivateActionPanel
            room={room}
            gamePhase={room.game?.phase ?? "lobby"}
            privateView={privateView}
            session={session}
            isSubmitting={isSubmittingAction}
            onStartGame={onStartGame}
            onSubmitTeam={onSubmitTeam}
            onSubmitTeamVote={onSubmitTeamVote}
            onSubmitQuestVote={onSubmitQuestVote}
            onSubmitAssassinPick={onSubmitAssassinPick}
          />

          {!room.game ? <LobbyPanel room={room} /> : null}
          {room.game?.phase === "game-over" ? <FinalRevealPanel game={room.game} /> : null}
        </section>

        <aside className="panel-surface side-panel" aria-label="Private seat notes">
          <p className="eyebrow">Seat Notes</p>
          <h2>Your view</h2>
          {privateView ? (
            <>
              <p className="role-badge">{privateView.role.replace(/-/g, " ")}</p>
              <p className="muted-copy">
                {getSeenPlayers(privateView).length > 0
                  ? getSeenPlayers(privateView).join(", ")
                  : "No extra knowledge is visible from this seat."}
              </p>
            </>
          ) : (
            <p className="muted-copy">Private role information will appear here after the game starts.</p>
          )}
        </aside>
      </section>
    </main>
  )
}

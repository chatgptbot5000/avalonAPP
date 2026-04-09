export type Role =
  | "merlin"
  | "assassin"
  | "percival"
  | "morgana"
  | "mordred"
  | "oberon"
  | "loyal-servant"
  | "minion"

export type GamePhase =
  | "lobby"
  | "role-reveal"
  | "team-proposal"
  | "team-vote"
  | "quest-vote"
  | "quest-result"
  | "assassin-pick"
  | "game-over"

export type QuestOutcome = "success" | "fail"

export type TeamVote = "approve" | "reject"

export type QuestVote = "success" | "fail"

export type GamePlayer = {
  id: string
  name: string
}

export type PublicRoundResult = {
  questNumber: number
  outcome: QuestOutcome
  failCount: number
  teamMemberIds: string[]
}

export type GameWinner = "good" | "evil" | null

export type GameState = {
  phase: GamePhase
  players: GamePlayer[]
  roundNumber: number
  questNumber: number
  leaderIndex: number
  leaderPlayerId: string
  questResults: QuestOutcome[]
  rejectedTeams: number
  teamSize: number
  proposedTeam: string[]
  approvedTeam: string[]
  teamVotes: Record<string, TeamVote>
  questVotes: Record<string, QuestVote>
  roles: Record<string, Role>
  winner: GameWinner
  publicHistory: PublicRoundResult[]
}

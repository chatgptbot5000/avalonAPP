import { buildRoleList, getQuestTeamSize, requiresTwoFailsOnQuest } from "./config"

import type {
  GamePlayer,
  GameState,
  QuestOutcome,
  QuestVote,
  Role,
  TeamVote,
} from "@/types/game"

const EVIL_ROLES: Role[] = ["assassin", "morgana", "mordred", "oberon", "minion"]

function getPlayerIndex(game: GameState, playerId: string): number {
  const index = game.players.findIndex((player) => player.id === playerId)

  if (index === -1) {
    throw new Error(`Unknown player: ${playerId}`)
  }

  return index
}

function getNextLeaderIndex(game: GameState): number {
  return (game.leaderIndex + 1) % game.players.length
}

function isGoodRole(role: Role): boolean {
  return !EVIL_ROLES.includes(role)
}

function shuffleRoles(roles: Role[]): Role[] {
  const shuffled = [...roles]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const nextRole = shuffled[index]

    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = nextRole
  }

  return shuffled
}

function createRoles(players: GamePlayer[]): Record<string, Role> {
  const roles = shuffleRoles(buildRoleList(players.length))

  return players.reduce<Record<string, Role>>((assigned, player, index) => {
    assigned[player.id] = roles[index]
    return assigned
  }, {})
}

function countVotes<TVote extends TeamVote | QuestVote>(votes: Record<string, TVote>, vote: TVote): number {
  return Object.values(votes).filter((value) => value === vote).length
}

function advanceToNextQuest(game: GameState, questOutcome: QuestOutcome): GameState {
  const nextLeaderIndex = getNextLeaderIndex(game)
  const nextQuestNumber = game.questNumber + 1

  return {
    ...game,
    phase: "team-proposal",
    roundNumber: game.roundNumber + 1,
    questNumber: nextQuestNumber,
    leaderIndex: nextLeaderIndex,
    leaderPlayerId: game.players[nextLeaderIndex].id,
    questResults: [...game.questResults, questOutcome],
    rejectedTeams: 0,
    teamSize: getQuestTeamSize(game.players.length, nextQuestNumber),
    proposedTeam: [],
    teamVotes: {},
    questVotes: {},
  }
}

export function createGameState(players: GamePlayer[]): GameState {
  if (players.length === 0) {
    throw new Error("At least one player is required")
  }

  return {
    phase: "team-proposal",
    players,
    roundNumber: 1,
    questNumber: 1,
    leaderIndex: 0,
    leaderPlayerId: players[0].id,
    questResults: [],
    rejectedTeams: 0,
    teamSize: getQuestTeamSize(players.length, 1),
    proposedTeam: [],
    teamVotes: {},
    questVotes: {},
    roles: createRoles(players),
    winner: null,
    publicHistory: [],
  }
}

export function startTeamVote(game: GameState, leaderPlayerId: string, proposedTeam: string[]): GameState {
  if (game.phase !== "team-proposal") {
    throw new Error(`Cannot start a team vote during ${game.phase}`)
  }

  if (leaderPlayerId !== game.leaderPlayerId) {
    throw new Error(`Only the current leader can propose a team: ${game.leaderPlayerId}`)
  }

  if (proposedTeam.length !== game.teamSize) {
    throw new Error(`Expected ${game.teamSize} players on the proposed team`)
  }

  if (new Set(proposedTeam).size !== proposedTeam.length) {
    throw new Error("Proposed team cannot contain duplicate players")
  }

  const leaderIndex = getPlayerIndex(game, leaderPlayerId)
  proposedTeam.forEach((playerId) => {
    getPlayerIndex(game, playerId)
  })

  return {
    ...game,
    phase: "team-vote",
    leaderIndex,
    leaderPlayerId,
    proposedTeam: [...proposedTeam],
    teamVotes: {},
    questVotes: {},
  }
}

export function submitTeamVote(game: GameState, playerId: string, vote: TeamVote): GameState {
  if (game.phase !== "team-vote") {
    throw new Error(`Cannot submit a team vote during ${game.phase}`)
  }

  getPlayerIndex(game, playerId)

  if (playerId in game.teamVotes) {
    throw new Error(`Player already voted on this team: ${playerId}`)
  }

  const teamVotes = {
    ...game.teamVotes,
    [playerId]: vote,
  }
  const approvalCount = countVotes(teamVotes, "approve")
  const rejectionCount = countVotes(teamVotes, "reject")
  const majority = Math.floor(game.players.length / 2) + 1

  if (approvalCount >= majority) {
    return {
      ...game,
      phase: "quest-vote",
      teamVotes,
    }
  }

  if (rejectionCount >= majority || Object.keys(teamVotes).length === game.players.length) {
    const nextLeaderIndex = getNextLeaderIndex(game)
    const rejectedTeams = game.rejectedTeams + 1

    if (rejectedTeams >= 5) {
      return {
        ...game,
        phase: "game-over",
        rejectedTeams,
        teamVotes,
        questVotes: {},
        winner: "evil",
      }
    }

    return {
      ...game,
      phase: "team-proposal",
      roundNumber: game.roundNumber + 1,
      leaderIndex: nextLeaderIndex,
      leaderPlayerId: game.players[nextLeaderIndex].id,
      rejectedTeams,
      proposedTeam: [],
      teamVotes,
      questVotes: {},
    }
  }

  return {
    ...game,
    teamVotes,
  }
}

export function startQuestVote(game: GameState): GameState {
  if (game.phase !== "quest-vote") {
    throw new Error(`Cannot start a quest vote during ${game.phase}`)
  }

  return {
    ...game,
    phase: "quest-vote",
    questVotes: {},
  }
}

export function submitQuestVote(game: GameState, playerId: string, vote: QuestVote): GameState {
  if (game.phase !== "quest-vote") {
    throw new Error(`Cannot submit a quest vote during ${game.phase}`)
  }

  if (!game.proposedTeam.includes(playerId)) {
    throw new Error(`Player ${playerId} is not on the quest team`)
  }

  if (playerId in game.questVotes) {
    throw new Error(`Player already voted on this quest: ${playerId}`)
  }

  if (vote === "fail" && isGoodRole(game.roles[playerId])) {
    throw new Error(`Good players cannot submit fail votes: ${playerId}`)
  }

  const questVotes = {
    ...game.questVotes,
    [playerId]: vote,
  }

  if (Object.keys(questVotes).length < game.proposedTeam.length) {
    return {
      ...game,
      questVotes,
    }
  }

  const failCount = countVotes(questVotes, "fail")
  const outcome: QuestOutcome = failCount >= (requiresTwoFailsOnQuest(game.players.length, game.questNumber) ? 2 : 1) ? "fail" : "success"
  const questResults = [...game.questResults, outcome]
  const publicHistory = [
    ...game.publicHistory,
    {
      questNumber: game.questNumber,
      outcome,
      failCount,
    },
  ]

  if (questResults.filter((result) => result === "success").length >= 3) {
    return {
      ...game,
      phase: "assassin-pick",
      questResults,
      questVotes,
      publicHistory,
    }
  }

  if (questResults.filter((result) => result === "fail").length >= 3) {
    return {
      ...game,
      phase: "game-over",
      questResults,
      questVotes,
      publicHistory,
      winner: "evil",
    }
  }

  return {
    ...advanceToNextQuest(game, outcome),
    publicHistory,
    questResults,
    questVotes: {},
  }
}

export function submitAssassinPick(game: GameState, targetPlayerId: string): GameState {
  if (game.phase !== "assassin-pick") {
    throw new Error(`Cannot submit an assassin pick during ${game.phase}`)
  }

  getPlayerIndex(game, targetPlayerId)

  return {
    ...game,
    phase: "game-over",
    winner: game.roles[targetPlayerId] === "merlin" ? "evil" : "good",
  }
}

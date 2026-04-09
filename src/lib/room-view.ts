import { getPrivateKnowledge } from "@/game/knowledge"
import type { GameState } from "@/types/game"

export function buildPublicGameView(game: GameState) {
  const view = {
    phase: game.phase,
    roundNumber: game.roundNumber,
    questNumber: game.questNumber,
    leaderPlayerId: game.leaderPlayerId,
    teamSize: game.teamSize,
    proposedTeam: game.proposedTeam,
    publicHistory: game.publicHistory,
  }

  if (game.phase === "game-over") {
    return {
      ...view,
      winner: game.winner,
    }
  }

  return view
}

export function buildPrivateGameView(game: GameState, playerId: string) {
  const role = game.roles[playerId]
  const playerNamesById = Object.fromEntries(game.players.map((player) => [player.id, player.name]))
  const privateKnowledge = getPrivateKnowledge(role, game.roles, playerId)

  return {
    role,
    privateKnowledge: {
      seenPlayers: privateKnowledge.seenPlayers.map((seenPlayerId) => playerNamesById[seenPlayerId] ?? seenPlayerId),
    },
    canProposeTeam: game.phase === "team-proposal" && game.leaderPlayerId === playerId,
    canVoteTeam: game.phase === "team-vote" && !(playerId in game.teamVotes),
    canVoteQuest: game.phase === "quest-vote" && game.proposedTeam.includes(playerId) && !(playerId in game.questVotes),
    canPickMerlin: game.phase === "assassin-pick" && role === "assassin",
  }
}

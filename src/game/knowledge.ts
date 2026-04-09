import type { Role } from "@/types/game"

const EVIL_ROLES: Role[] = ["assassin", "morgana", "mordred", "oberon", "minion"]

const MERLIN_SEES: Role[] = ["assassin", "morgana", "minion"]

const PERCIVAL_SEES: Role[] = ["merlin", "morgana"]

const EVIL_TEAM_SEES: Role[] = ["assassin", "morgana", "mordred", "minion"]

export type PrivateKnowledge = {
  seenPlayers: string[]
}

export function isEvil(role: Role): boolean {
  return EVIL_ROLES.includes(role)
}

export function getPrivateKnowledge(
  role: Role,
  rolesByPlayerId: Record<string, Role>,
  currentPlayerId?: string,
): PrivateKnowledge {
  if (role === "merlin") {
    return {
      seenPlayers: Object.entries(rolesByPlayerId)
        .filter(([, playerRole]) => MERLIN_SEES.includes(playerRole))
        .map(([playerId]) => playerId),
    }
  }

  if (role === "percival") {
    return {
      seenPlayers: Object.entries(rolesByPlayerId)
        .filter(([, playerRole]) => PERCIVAL_SEES.includes(playerRole))
        .map(([playerId]) => playerId),
    }
  }

  if (EVIL_TEAM_SEES.includes(role)) {
    return {
      seenPlayers: Object.entries(rolesByPlayerId)
        .filter(([playerId, playerRole]) => EVIL_TEAM_SEES.includes(playerRole) && playerId !== currentPlayerId)
        .map(([playerId]) => playerId),
    }
  }

  return { seenPlayers: [] }
}

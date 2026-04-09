import type { Role } from "@/types/game"

const CLASSIC_ROLE_DISTRIBUTIONS: Record<number, Role[]> = {
  5: ["merlin", "assassin", "loyal-servant", "loyal-servant", "minion"],
  6: ["merlin", "percival", "assassin", "minion", "loyal-servant", "loyal-servant"],
  7: ["merlin", "percival", "morgana", "assassin", "loyal-servant", "loyal-servant", "minion"],
  8: ["merlin", "percival", "morgana", "assassin", "mordred", "loyal-servant", "loyal-servant", "minion"],
  9: ["merlin", "percival", "morgana", "assassin", "mordred", "oberon", "loyal-servant", "loyal-servant", "minion"],
  10: ["merlin", "percival", "morgana", "assassin", "mordred", "oberon", "loyal-servant", "loyal-servant", "minion", "minion"],
}

const QUEST_TEAM_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
}

function getQuestSizesForSetup(playerCount: number, questNumber: number): number[] {
  const sizes = QUEST_TEAM_SIZES[playerCount]

  if (!sizes || questNumber < 1 || questNumber > sizes.length) {
    throw new Error(`Unsupported quest setup: ${playerCount} players, quest ${questNumber}`)
  }

  return sizes
}

export function buildRoleList(playerCount: number): Role[] {
  const roles = CLASSIC_ROLE_DISTRIBUTIONS[playerCount]

  if (!roles) {
    throw new Error(`Unsupported player count: ${playerCount}`)
  }

  return [...roles]
}

export function getQuestTeamSize(playerCount: number, questNumber: number): number {
  const sizes = getQuestSizesForSetup(playerCount, questNumber)

  return sizes[questNumber - 1]
}

export function requiresTwoFailsOnQuest(playerCount: number, questNumber: number): boolean {
  getQuestSizesForSetup(playerCount, questNumber)

  return playerCount >= 7 && questNumber === 4
}

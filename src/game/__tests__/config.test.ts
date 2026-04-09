import { describe, expect, it } from "vitest"

import { buildRoleList, getQuestTeamSize, requiresTwoFailsOnQuest } from "../config"
import { isEvil } from "../knowledge"

describe("buildRoleList", () => {
  it("returns the planned role distributions for 5 through 10 players", () => {
    expect(buildRoleList(5)).toEqual([
      "merlin",
      "assassin",
      "loyal-servant",
      "loyal-servant",
      "minion",
    ])

    expect(buildRoleList(6)).toEqual([
      "merlin",
      "percival",
      "assassin",
      "minion",
      "loyal-servant",
      "loyal-servant",
    ])

    expect(buildRoleList(7)).toEqual([
      "merlin",
      "percival",
      "morgana",
      "assassin",
      "loyal-servant",
      "loyal-servant",
      "minion",
    ])

    expect(buildRoleList(8)).toEqual([
      "merlin",
      "percival",
      "morgana",
      "assassin",
      "mordred",
      "loyal-servant",
      "loyal-servant",
      "minion",
    ])

    expect(buildRoleList(9)).toEqual([
      "merlin",
      "percival",
      "morgana",
      "assassin",
      "mordred",
      "oberon",
      "loyal-servant",
      "loyal-servant",
      "minion",
    ])

    expect(buildRoleList(10)).toEqual([
      "merlin",
      "percival",
      "morgana",
      "assassin",
      "mordred",
      "oberon",
      "loyal-servant",
      "loyal-servant",
      "minion",
      "minion",
    ])
  })

  it("rejects unsupported player counts", () => {
    expect(() => buildRoleList(4)).toThrow("Unsupported player count: 4")
    expect(() => buildRoleList(11)).toThrow("Unsupported player count: 11")
  })
})

describe("getQuestTeamSize", () => {
  it("returns planned quest sizes across multiple player counts", () => {
    expect(getQuestTeamSize(5, 1)).toBe(2)
    expect(getQuestTeamSize(6, 3)).toBe(4)
    expect(getQuestTeamSize(7, 4)).toBe(4)
    expect(getQuestTeamSize(8, 5)).toBe(5)
    expect(getQuestTeamSize(10, 2)).toBe(4)
  })

  it("rejects unsupported quest setups", () => {
    expect(() => getQuestTeamSize(4, 1)).toThrow("Unsupported quest setup: 4 players, quest 1")
    expect(() => getQuestTeamSize(5, 0)).toThrow("Unsupported quest setup: 5 players, quest 0")
    expect(() => getQuestTeamSize(10, 6)).toThrow("Unsupported quest setup: 10 players, quest 6")
  })
})

describe("requiresTwoFailsOnQuest", () => {
  it("only requires two fails on quest 4 in 7+ player games", () => {
    expect(requiresTwoFailsOnQuest(7, 4)).toBe(true)
    expect(requiresTwoFailsOnQuest(8, 4)).toBe(true)
    expect(requiresTwoFailsOnQuest(6, 4)).toBe(false)
    expect(requiresTwoFailsOnQuest(7, 3)).toBe(false)
  })

  it("rejects unsupported quest setups", () => {
    expect(() => requiresTwoFailsOnQuest(4, 4)).toThrow("Unsupported quest setup: 4 players, quest 4")
    expect(() => requiresTwoFailsOnQuest(7, 0)).toThrow("Unsupported quest setup: 7 players, quest 0")
    expect(() => requiresTwoFailsOnQuest(10, 6)).toThrow("Unsupported quest setup: 10 players, quest 6")
  })
})

describe("isEvil", () => {
  it("returns true only for evil roles", () => {
    expect(isEvil("assassin")).toBe(true)
    expect(isEvil("morgana")).toBe(true)
    expect(isEvil("mordred")).toBe(true)
    expect(isEvil("oberon")).toBe(true)
    expect(isEvil("minion")).toBe(true)

    expect(isEvil("merlin")).toBe(false)
    expect(isEvil("percival")).toBe(false)
    expect(isEvil("loyal-servant")).toBe(false)
  })
})

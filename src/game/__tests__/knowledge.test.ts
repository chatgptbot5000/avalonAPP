import { describe, expect, it } from "vitest"

import { getPrivateKnowledge, isEvil } from "../knowledge"
import { buildPrivateGameView, buildPublicGameView } from "@/lib/room-view"
import type { GameState } from "@/types/game"

function createGame(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "team-vote",
    players: [
      { id: "p1", name: "A" },
      { id: "p2", name: "B" },
      { id: "p3", name: "C" },
      { id: "p4", name: "D" },
      { id: "p5", name: "E" },
    ],
    roundNumber: 1,
    questNumber: 1,
    leaderIndex: 0,
    leaderPlayerId: "p1",
    questResults: [],
    rejectedTeams: 0,
    teamSize: 2,
    proposedTeam: ["p1", "p2"],
    approvedTeam: [],
    teamVotes: {},
    questVotes: {},
    roles: {
      p1: "assassin",
      p2: "merlin",
      p3: "morgana",
      p4: "mordred",
      p5: "loyal-servant",
    },
    winner: null,
    publicHistory: [],
    ...overrides,
  }
}

describe("getPrivateKnowledge", () => {
  it("shows Merlin every evil role except Mordred", () => {
    const result = getPrivateKnowledge("merlin", {
      p1: "merlin",
      p2: "assassin",
      p3: "mordred",
      p4: "morgana",
      p5: "minion",
      p6: "oberon",
      p7: "loyal-servant",
    })

    expect(result.seenPlayers).toEqual(["p2", "p4", "p5"])
  })

  it("shows Percival both Merlin and Morgana", () => {
    const result = getPrivateKnowledge("percival", {
      p1: "percival",
      p2: "merlin",
      p3: "morgana",
      p4: "assassin",
      p5: "loyal-servant",
    })

    expect(result.seenPlayers).toEqual(["p2", "p3"])
  })

  it("hides the current evil role from evil private knowledge", () => {
    const result = getPrivateKnowledge("assassin", {
      p1: "assassin",
      p2: "merlin",
      p3: "morgana",
      p4: "mordred",
      p5: "loyal-servant",
    }, "p1")

    expect(result.seenPlayers).toEqual(["p3", "p4"])
  })

  it("lets a minion see the other minion but not itself", () => {
    const result = getPrivateKnowledge("minion", {
      p1: "minion",
      p2: "merlin",
      p3: "morgana",
      p4: "mordred",
      p5: "assassin",
      p6: "minion",
      p7: "loyal-servant",
    }, "p1")

    expect(result.seenPlayers).toEqual(["p3", "p4", "p5", "p6"])
  })

  it("returns empty private knowledge for non-special good roles", () => {
    const result = getPrivateKnowledge("loyal-servant", {
      p1: "loyal-servant",
      p2: "merlin",
      p3: "morgana",
      p4: "assassin",
      p5: "minion",
    }, "p1")

    expect(result.seenPlayers).toEqual([])
  })

  it("builds a public game view without winner before game over", () => {
    const result = buildPublicGameView(createGame())

    expect(result).toEqual({
      phase: "team-vote",
      roundNumber: 1,
      questNumber: 1,
      leaderPlayerId: "p1",
      teamSize: 2,
      proposedTeam: ["p1", "p2"],
      approvedTeam: [],
      publicHistory: [],
    })
  })

  it("builds a public game view with winner only at game over", () => {
    const result = buildPublicGameView(createGame({ phase: "game-over", winner: "good" }))

    expect(result).toEqual({
      phase: "game-over",
      roundNumber: 1,
      questNumber: 1,
      leaderPlayerId: "p1",
      teamSize: 2,
      proposedTeam: ["p1", "p2"],
      approvedTeam: [],
      publicHistory: [],
      winner: "good",
      finalReveal: [
        { playerId: "p1", playerName: "A", role: "assassin" },
        { playerId: "p2", playerName: "B", role: "merlin" },
        { playerId: "p3", playerName: "C", role: "morgana" },
        { playerId: "p4", playerName: "D", role: "mordred" },
        { playerId: "p5", playerName: "E", role: "loyal-servant" },
      ],
    })
  })

  it("builds a private game view with role, knowledge, and action gates", () => {
    const result = buildPrivateGameView(createGame(), "p1")

    expect(result).toEqual({
      role: "assassin",
      privateKnowledge: { seenPlayers: ["C", "D"] },
      canProposeTeam: false,
      canVoteTeam: true,
      canVoteQuest: false,
      canPickMerlin: false,
    })
  })

  it("keeps isEvil behavior working", () => {
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

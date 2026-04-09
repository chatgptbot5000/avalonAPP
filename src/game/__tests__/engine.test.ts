import { afterEach, describe, expect, it, vi } from "vitest"

import {
  createGameState,
  startTeamVote,
  submitTeamVote,
  startQuestVote,
  submitQuestVote,
  submitAssassinPick,
} from "../engine"

function createPlayers(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: String.fromCharCode(65 + index),
  }))
}

function approveTeam(game: ReturnType<typeof createGameState>) {
  const majority = Math.floor(game.players.length / 2) + 1

  return game.players.slice(0, majority).reduce(
    (current, player) => submitTeamVote(current, player.id, "approve"),
    game,
  )
}

function rejectTeam(game: ReturnType<typeof createGameState>) {
  const majority = Math.floor(game.players.length / 2) + 1

  return game.players.slice(0, majority).reduce(
    (current, player) => submitTeamVote(current, player.id, "reject"),
    game,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe("engine", () => {
  it("shuffles hidden role assignment instead of using join order", () => {
    vi.spyOn(Math, "random").mockReturnValue(0)

    const game = createGameState(createPlayers(5))

    expect(game.roles).toEqual({
      p1: "assassin",
      p2: "loyal-servant",
      p3: "loyal-servant",
      p4: "minion",
      p5: "merlin",
    })
  })

  it("advances from team vote to quest vote after approval", () => {
    const game = createGameState(createPlayers(5))

    const voteState = startTeamVote(game, "p1", ["p1", "p2"])
    const afterVotes = approveTeam(voteState)

    expect(afterVotes.phase).toBe("quest-vote")
  })

  it("enters assassin pick after the third successful quest", () => {
    let game = createGameState(createPlayers(5))

    game = startTeamVote(game, "p1", ["p1", "p2"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p1", "success")
    game = submitQuestVote(game, "p2", "success")

    game = startTeamVote(game, "p2", ["p2", "p3", "p4"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p2", "success")
    game = submitQuestVote(game, "p3", "success")
    game = submitQuestVote(game, "p4", "success")

    game = startTeamVote(game, "p3", ["p1", "p3"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p1", "success")
    game = submitQuestVote(game, "p3", "success")

    expect(game.phase).toBe("assassin-pick")
  })

  it("requires the team proposal phase and current leader to start team vote", () => {
    const game = createGameState(createPlayers(5))

    expect(() => startTeamVote(game, "p2", ["p1", "p2"])).toThrow()

    const voteState = startTeamVote(game, "p1", ["p1", "p2"])

    expect(() => startTeamVote(voteState, "p1", ["p1", "p2"])).toThrow()
  })

  it("ends the game with an evil win after the fifth rejected team", () => {
    let game = createGameState(createPlayers(5))

    for (let rejection = 0; rejection < 5; rejection += 1) {
      const leaderIndex = game.leaderIndex
      const proposedTeam = [
        game.players[leaderIndex].id,
        game.players[(leaderIndex + 1) % game.players.length].id,
      ]

      game = startTeamVote(game, game.leaderPlayerId, proposedTeam)
      game = rejectTeam(game)
    }

    expect(game.phase).toBe("game-over")
    expect(game.winner).toBe("evil")
    expect(game.rejectedTeams).toBe(5)
  })

  it("rejects duplicate players in a proposed team", () => {
    const game = createGameState(createPlayers(5))

    expect(() => startTeamVote(game, "p1", ["p1", "p1"])).toThrow()
  })

  it("does not allow a good player to submit a fail vote", () => {
    let game = createGameState(createPlayers(5))

    game = {
      ...game,
      roles: {
        p1: "merlin",
        p2: "assassin",
        p3: "loyal-servant",
        p4: "loyal-servant",
        p5: "minion",
      },
    }

    game = startTeamVote(game, "p1", ["p1", "p2"])
    game = approveTeam(game)
    game = startQuestVote(game)

    expect(() => submitQuestVote(game, "p1", "fail")).toThrow()
  })

  it("rejects team votes outside the team-vote phase", () => {
    let game = createGameState(createPlayers(5))

    game = startTeamVote(game, "p1", ["p1", "p2"])
    game = approveTeam(game)

    expect(() => submitTeamVote(game, "p4", "approve")).toThrow(
      "Cannot submit a team vote during quest-vote",
    )
  })

  it("rejects duplicate team votes from the same player", () => {
    let game = createGameState(createPlayers(5))

    game = startTeamVote(game, "p1", ["p1", "p2"])
    game = submitTeamVote(game, "p1", "approve")

    expect(() => submitTeamVote(game, "p1", "reject")).toThrow(/already voted|duplicate/i)
  })

  it("rejects duplicate quest votes from the same player", () => {
    let game = createGameState(createPlayers(5))

    game = {
      ...game,
      roles: {
        p1: "merlin",
        p2: "assassin",
        p3: "loyal-servant",
        p4: "loyal-servant",
        p5: "minion",
      },
    }

    game = startTeamVote(game, "p1", ["p1", "p2"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p1", "success")

    expect(() => submitQuestVote(game, "p1", "success")).toThrow(/already voted|duplicate/i)
  })

  it("resolves the assassin pick and awards evil when merlin is found", () => {
    let game = createGameState(createPlayers(5))

    game = {
      ...game,
      roles: {
        p1: "merlin",
        p2: "assassin",
        p3: "loyal-servant",
        p4: "loyal-servant",
        p5: "minion",
      },
    }

    game = startTeamVote(game, "p1", ["p1", "p2"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p1", "success")
    game = submitQuestVote(game, "p2", "success")

    game = startTeamVote(game, "p2", ["p2", "p3", "p4"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p2", "success")
    game = submitQuestVote(game, "p3", "success")
    game = submitQuestVote(game, "p4", "success")

    game = startTeamVote(game, "p3", ["p1", "p3"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p1", "success")
    game = submitQuestVote(game, "p3", "success")

    game = submitAssassinPick(game, "p1")

    expect(game.phase).toBe("game-over")
    expect(game.winner).toBe("evil")
  })

  it("requires two fails on quest four in a seven-player game", () => {
    let game = createGameState(createPlayers(7))

    game = {
      ...game,
      roles: {
        p1: "merlin",
        p2: "percival",
        p3: "morgana",
        p4: "assassin",
        p5: "loyal-servant",
        p6: "loyal-servant",
        p7: "minion",
      },
    }

    game = startTeamVote(game, "p1", ["p1", "p2"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p1", "success")
    game = submitQuestVote(game, "p2", "success")

    game = startTeamVote(game, "p2", ["p2", "p3", "p4"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p2", "success")
    game = submitQuestVote(game, "p3", "fail")
    game = submitQuestVote(game, "p4", "success")

    game = startTeamVote(game, "p3", ["p1", "p3", "p5"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p1", "success")
    game = submitQuestVote(game, "p3", "success")
    game = submitQuestVote(game, "p5", "success")

    game = startTeamVote(game, "p4", ["p2", "p4", "p6", "p7"])
    game = approveTeam(game)
    game = startQuestVote(game)
    game = submitQuestVote(game, "p2", "success")
    game = submitQuestVote(game, "p4", "fail")
    game = submitQuestVote(game, "p6", "success")
    game = submitQuestVote(game, "p7", "success")

    expect(game.publicHistory.at(-1)).toEqual({
      questNumber: 4,
      outcome: "success",
      failCount: 1,
    })
    expect(game.phase).toBe("assassin-pick")
  })
})

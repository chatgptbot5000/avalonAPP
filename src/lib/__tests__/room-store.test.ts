import { describe, expect, it, vi } from "vitest"

import { generateRoomCode } from "../room-code"
import { createRoomStore } from "../room-store"

describe("room store", () => {
  it("creates a room and lets guests join with unique names", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.joinRoom(room.code, "session-b", "B")

    expect(store.getRoom(room.code)?.players.map((player) => player.name)).toEqual(["Host", "B"])
  })

  it("assigns player ids independently from session ids", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    expect(room.players[0].id).not.toBe("session-host")
    expect(room.players[0].sessionId).toBe("session-host")
  })

  it("allows a player to rejoin their existing seat", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.rejoinRoom(room.code, "session-host")

    expect(store.getRoom(room.code)?.players[0].connected).toBe(true)
  })

  it("does not publish a new version when rejoining an already connected seat", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")
    const publishedVersions: number[] = []
    const unsubscribe = store.events.subscribe(room.code, (version) => {
      publishedVersions.push(version)
    })

    const rejoinedRoom = store.rejoinRoom(room.code, "session-host")

    unsubscribe()

    expect(rejoinedRoom.version).toBe(0)
    expect(store.getRoom(room.code)?.version).toBe(0)
    expect(publishedVersions).toEqual([])
  })

  it("rejects duplicate names case-insensitively", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    expect(() => store.joinRoom(room.code, "session-b", "host")).toThrow(/name/i)
  })

  it("rejects joins when the session already has a seat in the room", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    expect(() => store.joinRoom(room.code, "session-host", "Host Again")).toThrow(/session/i)
  })

  it("starts a game only for the host session", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.joinRoom(room.code, "session-b", "B")
    store.joinRoom(room.code, "session-c", "C")
    store.joinRoom(room.code, "session-d", "D")
    store.joinRoom(room.code, "session-e", "E")

    const currentRoom = store.getRoom(room.code)

    expect(() => store.startGame(room.code, "session-b")).toThrow(/host/i)

    const startedRoom = store.startGame(room.code, "session-host")

    expect(startedRoom.game?.phase).toBe("team-proposal")
    expect(startedRoom.game?.players).toEqual([
      { id: currentRoom?.players[0].id, name: "Host" },
      { id: currentRoom?.players[1].id, name: "B" },
      { id: currentRoom?.players[2].id, name: "C" },
      { id: currentRoom?.players[3].id, name: "D" },
      { id: currentRoom?.players[4].id, name: "E" },
    ])
  })

  it("rejects starting a game outside the supported 5-10 player range", () => {
    const tooSmallStore = createRoomStore()
    const tooSmallRoom = tooSmallStore.createRoom("session-host", "Host")

    tooSmallStore.joinRoom(tooSmallRoom.code, "session-b", "B")
    tooSmallStore.joinRoom(tooSmallRoom.code, "session-c", "C")
    tooSmallStore.joinRoom(tooSmallRoom.code, "session-d", "D")

    expect(() => tooSmallStore.startGame(tooSmallRoom.code, "session-host")).toThrow(/5-10|player count/i)

    const tooLargeStore = createRoomStore()
    const tooLargeRoom = tooLargeStore.createRoom("session-host", "Host")

    for (const [sessionId, name] of [
      ["session-b", "B"],
      ["session-c", "C"],
      ["session-d", "D"],
      ["session-e", "E"],
      ["session-f", "F"],
      ["session-g", "G"],
      ["session-h", "H"],
      ["session-i", "I"],
      ["session-j", "J"],
      ["session-k", "K"],
    ]) {
      tooLargeStore.joinRoom(tooLargeRoom.code, sessionId, name)
    }

    expect(() => tooLargeStore.startGame(tooLargeRoom.code, "session-host")).toThrow(/5-10|player count/i)
  })

  it("rejects joining after the game has started", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.joinRoom(room.code, "session-b", "B")
    store.joinRoom(room.code, "session-c", "C")
    store.joinRoom(room.code, "session-d", "D")
    store.joinRoom(room.code, "session-e", "E")
    store.startGame(room.code, "session-host")

    expect(() => store.joinRoom(room.code, "session-f", "F")).toThrow(/started|game/i)
  })

  it("rejects starting the game more than once", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.joinRoom(room.code, "session-b", "B")
    store.joinRoom(room.code, "session-c", "C")
    store.joinRoom(room.code, "session-d", "D")
    store.joinRoom(room.code, "session-e", "E")
    store.startGame(room.code, "session-host")

    expect(() => store.startGame(room.code, "session-host")).toThrow(/already|started|game/i)
  })

  it("rejects assassin picks from non-assassin sessions", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.joinRoom(room.code, "session-b", "B")
    store.joinRoom(room.code, "session-c", "C")
    store.joinRoom(room.code, "session-d", "D")
    store.joinRoom(room.code, "session-e", "E")
    store.startGame(room.code, "session-host")

    const currentRoom = store.getRoom(room.code)
    if (!currentRoom?.game) {
      throw new Error("Expected a started game")
    }

    currentRoom.game = {
      ...currentRoom.game,
      phase: "assassin-pick",
      roles: {
        ...currentRoom.game.roles,
        [currentRoom.players[0].id]: "merlin",
      },
    }

    expect(() =>
      store.applyAction(room.code, "session-host", {
        type: "submit-assassin-pick",
        targetPlayerId: currentRoom.players[1].id,
      }),
    ).toThrow(/assassin/i)
  })

  it("rejects duplicate team votes through room actions", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.joinRoom(room.code, "session-b", "B")
    store.joinRoom(room.code, "session-c", "C")
    store.joinRoom(room.code, "session-d", "D")
    store.joinRoom(room.code, "session-e", "E")
    store.startGame(room.code, "session-host")

    store.applyAction(room.code, "session-host", {
      type: "submit-team",
      team: [store.getRoom(room.code)?.players[0].id ?? "", store.getRoom(room.code)?.players[1].id ?? ""],
    })
    store.applyAction(room.code, "session-host", { type: "submit-team-vote", vote: "approve" })

    expect(() => store.applyAction(room.code, "session-host", { type: "submit-team-vote", vote: "reject" })).toThrow(
      /already voted/i,
    )
  })

  it("rejects duplicate quest votes through room actions", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.joinRoom(room.code, "session-b", "B")
    store.joinRoom(room.code, "session-c", "C")
    store.joinRoom(room.code, "session-d", "D")
    store.joinRoom(room.code, "session-e", "E")
    store.startGame(room.code, "session-host")

    const startedRoom = store.getRoom(room.code)
    if (!startedRoom?.game) {
      throw new Error("Expected a started game")
    }

    startedRoom.game = {
      ...startedRoom.game,
      roles: {
        [startedRoom.players[0].id]: "merlin",
        [startedRoom.players[1].id]: "assassin",
        [startedRoom.players[2].id]: "loyal-servant",
        [startedRoom.players[3].id]: "loyal-servant",
        [startedRoom.players[4].id]: "minion",
      },
    }

    store.applyAction(room.code, "session-host", {
      type: "submit-team",
      team: [startedRoom.players[0].id, startedRoom.players[1].id],
    })
    store.applyAction(room.code, "session-host", { type: "submit-team-vote", vote: "approve" })
    store.applyAction(room.code, "session-b", { type: "submit-team-vote", vote: "approve" })
    store.applyAction(room.code, "session-c", { type: "submit-team-vote", vote: "approve" })
    store.applyAction(room.code, "session-host", { type: "submit-quest-vote", vote: "success" })

    expect(() => store.applyAction(room.code, "session-host", { type: "submit-quest-vote", vote: "success" })).toThrow(
      /already voted/i,
    )
  })

  it("publishes incremented versions for room mutations", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")
    const versions: number[] = []
    const unsubscribe = store.events.subscribe(room.code, (version) => {
      versions.push(version)
    })

    store.joinRoom(room.code, "session-b", "B")
    store.rejoinRoom(room.code, "session-host")

    unsubscribe()
    store.joinRoom(room.code, "session-c", "C")

    expect(store.getRoom(room.code)?.version).toBe(2)
    expect(versions).toEqual([1])
  })

  it("resets a finished game with fresh roles for the same room", () => {
    const randomSpy = vi.spyOn(Math, "random")
    const values = [0, 0, 0, 0, 0.9, 0.9, 0.9, 0.9]
    randomSpy.mockImplementation(() => values.shift() ?? 0)

    const store = createRoomStore()
    const room = store.createRoom("session-host", "Host")

    store.joinRoom(room.code, "session-b", "B")
    store.joinRoom(room.code, "session-c", "C")
    store.joinRoom(room.code, "session-d", "D")
    store.joinRoom(room.code, "session-e", "E")
    store.startGame(room.code, "session-host")

    const startedRoom = store.getRoom(room.code)
    if (!startedRoom?.game) {
      throw new Error("Expected a started game")
    }

    const firstRoles = { ...startedRoom.game.roles }

    store.resetGame(room.code, "session-host")

    const resetRoom = store.getRoom(room.code)

    expect(resetRoom?.game?.phase).toBe("team-proposal")
    expect(resetRoom?.game?.proposedTeam).toEqual([])
    expect(resetRoom?.game?.publicHistory).toEqual([])
    expect(resetRoom?.game?.roles).not.toEqual(firstRoles)
  })
})

describe("room code", () => {
  it("creates a four-character code from the room alphabet", () => {
    expect(generateRoomCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/)
  })
})

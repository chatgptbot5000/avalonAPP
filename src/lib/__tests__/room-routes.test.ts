import { describe, expect, it } from "vitest"

import { POST as submitAction } from "@/app/api/rooms/[code]/action/route"
import { POST as joinRoom } from "@/app/api/rooms/[code]/join/route"
import { POST as rejoinRoom } from "@/app/api/rooms/[code]/rejoin/route"
import { POST as resetRoom } from "@/app/api/rooms/[code]/reset/route"
import { POST as startRoom } from "@/app/api/rooms/[code]/start/route"
import { POST as createRoom } from "@/app/api/rooms/route"
import { roomStore } from "@/lib/room-store"
import { buildPrivateGameView } from "@/lib/room-view"

describe("room routes", () => {
  it("creates a room and returns the room code", async () => {
    const request = new Request("http://localhost/api/rooms", {
      method: "POST",
      body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
    })

    const response = await createRoom(request)
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.room.code).toHaveLength(4)
  })

  it("joins and rejoins a room via the API", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    const joinResponse = await joinRoom(
      new Request(`http://localhost/api/rooms/${code}/join`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "guest-session", name: "Guest" }),
      }),
      { params: { code } },
    )
    const joinJson = await joinResponse.json()

    expect(joinResponse.status).toBe(200)
    expect(joinJson.room.players).toHaveLength(2)
    expect(joinJson.room.private).toBeNull()

    const rejoinResponse = await rejoinRoom(
      new Request(`http://localhost/api/rooms/${code}/rejoin`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "guest-session" }),
      }),
      { params: { code } },
    )
    const rejoinJson = await rejoinResponse.json()

    expect(rejoinResponse.status).toBe(200)
    expect(rejoinJson.room.players[1]).toMatchObject({
      name: "Guest",
      connected: true,
    })
  })

  it("starts a game and returns the private role for the caller", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    for (const [sessionId, name] of [
      ["guest-session-1", "Guest 1"],
      ["guest-session-2", "Guest 2"],
      ["guest-session-3", "Guest 3"],
      ["guest-session-4", "Guest 4"],
    ]) {
      await joinRoom(
        new Request(`http://localhost/api/rooms/${code}/join`, {
          method: "POST",
          body: JSON.stringify({ sessionId, name }),
        }),
        { params: { code } },
      )
    }

    const startResponse = await startRoom(
      new Request(`http://localhost/api/rooms/${code}/start`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session" }),
      }),
      { params: { code } },
    )
    const startJson = await startResponse.json()

    expect(startResponse.status).toBe(200)
    expect(startJson.room.game.phase).toBe("team-proposal")
    expect(startJson.room.private.role).toBeDefined()
    expect(startJson.room.private.privateKnowledge).toBeDefined()
  })

  it("does not expose another player's private role or knowledge in a session snapshot", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    for (const [sessionId, name] of [
      ["guest-session-1", "Guest 1"],
      ["guest-session-2", "Guest 2"],
      ["guest-session-3", "Guest 3"],
      ["guest-session-4", "Guest 4"],
    ]) {
      await joinRoom(
        new Request(`http://localhost/api/rooms/${code}/join`, {
          method: "POST",
          body: JSON.stringify({ sessionId, name }),
        }),
        { params: { code } },
      )
    }

    await startRoom(
      new Request(`http://localhost/api/rooms/${code}/start`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session" }),
      }),
      { params: { code } },
    )

    const guestSnapshotResponse = await rejoinRoom(
      new Request(`http://localhost/api/rooms/${code}/rejoin`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "guest-session-1" }),
      }),
      { params: { code } },
    )
    const guestSnapshotJson = await guestSnapshotResponse.json()
    const room = roomStore.getRoom(code)

    if (!room?.game) {
      throw new Error("Expected a started game")
    }

    const guestPlayer = room.players.find((player) => player.sessionId === "guest-session-1")

    if (!guestPlayer) {
      throw new Error("Expected guest player")
    }

    expect(guestSnapshotJson.room.game.roles).toBeUndefined()
    expect(guestSnapshotJson.room.players.every((player: { role?: string }) => player.role === undefined)).toBe(true)
    expect(guestSnapshotJson.room.private).toEqual(buildPrivateGameView(room.game, guestPlayer.id))
  })

  it("applies an action and returns the updated room snapshot", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    for (const [sessionId, name] of [
      ["guest-session-1", "Guest 1"],
      ["guest-session-2", "Guest 2"],
      ["guest-session-3", "Guest 3"],
      ["guest-session-4", "Guest 4"],
    ]) {
      await joinRoom(
        new Request(`http://localhost/api/rooms/${code}/join`, {
          method: "POST",
          body: JSON.stringify({ sessionId, name }),
        }),
        { params: { code } },
      )
    }

    const startResponse = await startRoom(
      new Request(`http://localhost/api/rooms/${code}/start`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session" }),
      }),
      { params: { code } },
    )
    const startJson = await startResponse.json()
    const proposedTeam = startJson.room.players.slice(0, 2).map((player: { id: string }) => player.id)

    const actionResponse = await submitAction(
      new Request(`http://localhost/api/rooms/${code}/action`, {
        method: "POST",
        body: JSON.stringify({
          sessionId: "host-session",
          action: {
            type: "submit-team",
            team: proposedTeam,
          },
        }),
      }),
      { params: { code } },
    )
    const actionJson = await actionResponse.json()

    expect(actionResponse.status).toBe(200)
    expect(actionJson.room.game.phase).toBe("team-vote")
    expect(actionJson.room.game.proposedTeam).toEqual(proposedTeam)
  })

  it("resets a completed game through the API", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    for (const [sessionId, name] of [
      ["guest-session-1", "Guest 1"],
      ["guest-session-2", "Guest 2"],
      ["guest-session-3", "Guest 3"],
      ["guest-session-4", "Guest 4"],
    ]) {
      await joinRoom(
        new Request(`http://localhost/api/rooms/${code}/join`, {
          method: "POST",
          body: JSON.stringify({ sessionId, name }),
        }),
        { params: { code } },
      )
    }

    await startRoom(
      new Request(`http://localhost/api/rooms/${code}/start`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session" }),
      }),
      { params: { code } },
    )

    const response = await resetRoom(
      new Request(`http://localhost/api/rooms/${code}/reset`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session" }),
      }),
      { params: { code } },
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.room.game.phase).toBe("team-proposal")
    expect(json.room.game.publicHistory).toEqual([])
    expect(json.room.game.approvedTeam).toEqual([])
  })

  it("returns a 4xx response for duplicate joins", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    const response = await joinRoom(
      new Request(`http://localhost/api/rooms/${code}/join`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "guest-session", name: "Host" }),
      }),
      { params: { code } },
    )
    const json = await response.json()

    expect(response.status).toBe(409)
    expect(json.error).toMatch(/taken|duplicate|name/i)
  })

  it("returns a 4xx response when a non-host tries to start the game", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    await joinRoom(
      new Request(`http://localhost/api/rooms/${code}/join`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "guest-session", name: "Guest" }),
      }),
      { params: { code } },
    )

    const response = await startRoom(
      new Request(`http://localhost/api/rooms/${code}/start`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "guest-session" }),
      }),
      { params: { code } },
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toMatch(/host/i)
  })

  it("returns a controlled 4xx response for unsupported room sizes", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    for (const [sessionId, name] of [
      ["guest-session-1", "Guest 1"],
      ["guest-session-2", "Guest 2"],
      ["guest-session-3", "Guest 3"],
    ]) {
      await joinRoom(
        new Request(`http://localhost/api/rooms/${code}/join`, {
          method: "POST",
          body: JSON.stringify({ sessionId, name }),
        }),
        { params: { code } },
      )
    }

    const response = await startRoom(
      new Request(`http://localhost/api/rooms/${code}/start`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session" }),
      }),
      { params: { code } },
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/5-10|player count/i)
  })

  it("returns a 4xx response when a non-assassin session attempts an assassin pick", async () => {
    const createResponse = await createRoom(
      new Request("http://localhost/api/rooms", {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session", name: "Host" }),
      }),
    )
    const createJson = await createResponse.json()
    const { code } = createJson.room

    for (const [sessionId, name] of [
      ["guest-session-1", "Guest 1"],
      ["guest-session-2", "Guest 2"],
      ["guest-session-3", "Guest 3"],
      ["guest-session-4", "Guest 4"],
    ]) {
      await joinRoom(
        new Request(`http://localhost/api/rooms/${code}/join`, {
          method: "POST",
          body: JSON.stringify({ sessionId, name }),
        }),
        { params: { code } },
      )
    }

    await startRoom(
      new Request(`http://localhost/api/rooms/${code}/start`, {
        method: "POST",
        body: JSON.stringify({ sessionId: "host-session" }),
      }),
      { params: { code } },
    )

    const room = roomStore.getRoom(code)
    if (!room?.game) {
      throw new Error("Expected a started game")
    }

    room.game = {
      ...room.game,
      phase: "assassin-pick",
      roles: {
        ...room.game.roles,
        [room.players[0].id]: "merlin",
      },
    }

    const response = await submitAction(
      new Request(`http://localhost/api/rooms/${code}/action`, {
        method: "POST",
        body: JSON.stringify({
          sessionId: "host-session",
          action: {
            type: "submit-assassin-pick",
            targetPlayerId: room.players[1].id,
          },
        }),
      }),
      { params: { code } },
    )
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.error).toMatch(/assassin/i)
  })
})

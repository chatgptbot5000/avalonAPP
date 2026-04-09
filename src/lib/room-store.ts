import {
  createGameState,
  startTeamVote,
  submitAssassinPick,
  submitQuestVote,
  submitTeamVote,
} from "@/game/engine"
import type { QuestVote, TeamVote } from "@/types/game"

import { generateRoomCode } from "./room-code"
import { createRoomEvents } from "./room-events"
import { buildPrivateGameView, buildPublicGameView } from "./room-view"

type RoomPlayer = {
  id: string
  sessionId: string
  name: string
  connected: boolean
}

type Room = {
  code: string
  hostSessionId: string
  version: number
  players: RoomPlayer[]
  game: ReturnType<typeof createGameState> | null
}

export type RoomAction =
  | { type: "submit-team"; team: string[] }
  | { type: "submit-team-vote"; vote: TeamVote }
  | { type: "submit-quest-vote"; vote: QuestVote }
  | { type: "submit-assassin-pick"; targetPlayerId: string }

function createPlayer(playerId: string, sessionId: string, name: string): RoomPlayer {
  return {
    id: playerId,
    sessionId,
    name,
    connected: true,
  }
}

function getRoomOrThrow(rooms: Map<string, Room>, roomCode: string) {
  const room = rooms.get(roomCode)

  if (!room) {
    throw new Error(`Unknown room: ${roomCode}`)
  }

  return room
}

function updateRoom(rooms: Map<string, Room>, events: ReturnType<typeof createRoomEvents>, room: Room) {
  const nextRoom = {
    ...room,
    version: room.version + 1,
  }

  rooms.set(nextRoom.code, nextRoom)
  events.publish(nextRoom.code, nextRoom.version)

  return nextRoom
}

function validateRoomSize(playerCount: number) {
  if (playerCount < 5 || playerCount > 10) {
    throw new Error(`Games support 5-10 players: ${playerCount}`)
  }
}

export function createRoomStore() {
  const rooms = new Map<string, Room>()
  const events = createRoomEvents()
  let nextPlayerId = 1

  function generatePlayerId() {
    const playerId = `player-${nextPlayerId}`
    nextPlayerId += 1
    return playerId
  }

  function getPlayerForSession(room: Room, sessionId: string) {
    const player = room.players.find((entry) => entry.sessionId === sessionId)

    if (!player) {
      throw new Error(`Unknown session: ${sessionId}`)
    }

    return player
  }

  function buildSnapshot(room: Room, sessionId: string) {
    const player = getPlayerForSession(room, sessionId)

    return {
      code: room.code,
      version: room.version,
      players: room.players.map(({ id, name, connected }) => ({ id, name, connected })),
      game: room.game ? buildPublicGameView(room.game) : null,
      private: room.game ? buildPrivateGameView(room.game, player.id) : null,
      session: {
        playerId: player.id,
        isHost: room.hostSessionId === sessionId,
      },
    }
  }

  function buildPublicSnapshot(room: Room) {
    return {
      code: room.code,
      version: room.version,
      players: room.players.map(({ id, name, connected }) => ({ id, name, connected })),
      game: room.game ? buildPublicGameView(room.game) : null,
    }
  }

  return {
    events,
    createRoom(sessionId: string, name: string) {
      let code = generateRoomCode()

      while (rooms.has(code)) {
        code = generateRoomCode()
      }

      const room: Room = {
        code,
        hostSessionId: sessionId,
        version: 0,
        players: [createPlayer(generatePlayerId(), sessionId, name)],
        game: null,
      }

      rooms.set(code, room)
      events.publish(code, room.version)

      return room
    },
    getRoom(roomCode: string) {
      return rooms.get(roomCode)
    },
    joinRoom(roomCode: string, sessionId: string, name: string) {
      const room = getRoomOrThrow(rooms, roomCode)
      const normalizedName = name.trim().toLowerCase()

      if (room.game) {
        throw new Error("Cannot join after the game has started")
      }

      if (room.players.some((player) => player.sessionId === sessionId)) {
        throw new Error(`Session already joined room: ${sessionId}`)
      }

      if (room.players.some((player) => player.name.trim().toLowerCase() === normalizedName)) {
        throw new Error(`Player name already taken: ${name}`)
      }

      return updateRoom(rooms, events, {
        ...room,
        players: [...room.players, createPlayer(generatePlayerId(), sessionId, name)],
      })
    },
    rejoinRoom(roomCode: string, sessionId: string) {
      const room = getRoomOrThrow(rooms, roomCode)
      const playerIndex = room.players.findIndex((player) => player.sessionId === sessionId)

      if (playerIndex === -1) {
        throw new Error(`Unknown session: ${sessionId}`)
      }

      if (room.players[playerIndex].connected) {
        return room
      }

      const players = [...room.players]
      players[playerIndex] = {
        ...players[playerIndex],
        connected: true,
      }

      return updateRoom(rooms, events, {
        ...room,
        players,
      })
    },
    startGame(roomCode: string, sessionId: string) {
      const room = getRoomOrThrow(rooms, roomCode)

      if (room.hostSessionId !== sessionId) {
        throw new Error("Only the host can start the game")
      }

      if (room.game) {
        throw new Error("Game already started")
      }

      validateRoomSize(room.players.length)

      return updateRoom(rooms, events, {
        ...room,
        game: createGameState(room.players.map((player) => ({ id: player.id, name: player.name }))),
      })
    },
    applyAction(roomCode: string, sessionId: string, action: RoomAction) {
      const room = getRoomOrThrow(rooms, roomCode)
      const player = getPlayerForSession(room, sessionId)

      if (!room.game) {
        throw new Error("Game not started")
      }

      const game =
        action.type === "submit-team"
          ? startTeamVote(room.game, player.id, action.team)
          : action.type === "submit-team-vote"
            ? submitTeamVote(room.game, player.id, action.vote)
            : action.type === "submit-quest-vote"
              ? submitQuestVote(room.game, player.id, action.vote)
              : room.game.roles[player.id] === "assassin"
                ? submitAssassinPick(room.game, action.targetPlayerId)
                : (() => {
                    throw new Error("Only the assassin can submit an assassin pick")
                  })()

      return updateRoom(rooms, events, {
        ...room,
        game,
      })
    },
    snapshotForSession(roomCode: string, sessionId: string) {
      return buildSnapshot(getRoomOrThrow(rooms, roomCode), sessionId)
    },
    snapshot(roomCode: string) {
      return buildPublicSnapshot(getRoomOrThrow(rooms, roomCode))
    },
  }
}

const globalForRoomStore = globalThis as typeof globalThis & {
  __avalonRoomStore?: ReturnType<typeof createRoomStore>
}

export const roomStore = globalForRoomStore.__avalonRoomStore ?? (globalForRoomStore.__avalonRoomStore = createRoomStore())

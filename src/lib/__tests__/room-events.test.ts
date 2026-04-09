import { describe, expect, it, vi } from "vitest"

import { GET } from "@/app/api/rooms/[code]/events/route"
import { roomStore, createRoomStore } from "../room-store"

const decoder = new TextDecoder()

async function readChunk(reader: ReadableStreamDefaultReader<Uint8Array>, timeoutMs = 50) {
  const result = await Promise.race([
    reader.read(),
    new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), timeoutMs)
    }),
  ])

  if (result === null || result.done || !result.value) {
    return null
  }

  return decoder.decode(result.value)
}

describe("room events", () => {
  it("publishes a higher version when room state changes", () => {
    const room = roomStore.createRoom("session-a", "Host")
    let latestVersion = 0

    const unsubscribe = roomStore.events.subscribe(room.code, (version) => {
      latestVersion = version
    })

    roomStore.joinRoom(room.code, "session-b", "B")

    unsubscribe()
    expect(latestVersion).toBeGreaterThan(0)
  })

  it("returns a stable public snapshot with the current version", () => {
    const store = createRoomStore()
    const room = store.createRoom("session-a", "Host")

    expect(store.snapshot(room.code)).toEqual({
      code: room.code,
      version: 0,
      players: [{ id: room.players[0].id, name: "Host", connected: true }],
      game: null,
    })
  })

  it("does not miss updates published during stream setup", async () => {
    const room = roomStore.createRoom("session-race-host", "Host")
    const controller = new AbortController()
    const request = new Request(`http://localhost/api/rooms/${room.code}/events`, {
      signal: controller.signal,
    })
    const originalSnapshot = roomStore.snapshot.bind(roomStore)

    ;(roomStore as typeof roomStore & { snapshot: typeof roomStore.snapshot }).snapshot = (code: string) => {
      const snapshot = originalSnapshot(code)
      roomStore.joinRoom(code, "session-race-b", "B")
      return snapshot
    }

    try {
      const response = await GET(request, { params: { code: room.code } })
      const reader = response.body?.getReader()

      expect(reader).toBeDefined()
      expect(await readChunk(reader!)).toContain('"version":0')
      expect(await readChunk(reader!)).toContain('"version":1')

      controller.abort()
    } finally {
      ;(roomStore as typeof roomStore & { snapshot: typeof roomStore.snapshot }).snapshot = originalSnapshot
    }
  })

  it("cleans up the subscription and heartbeat when the stream is canceled", async () => {
    const room = roomStore.createRoom("session-cancel-host", "Host")
    const controller = new AbortController()
    const request = new Request(`http://localhost/api/rooms/${room.code}/events`, {
      signal: controller.signal,
    })
    const unsubscribe = vi.fn()
    const subscribeSpy = vi.spyOn(roomStore.events, "subscribe").mockImplementation(() => unsubscribe)
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval")
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval")

    try {
      const response = await GET(request, { params: { code: room.code } })
      const reader = response.body?.getReader()

      expect(reader).toBeDefined()
      expect(await readChunk(reader!)).toContain('"version":0')

      await reader!.cancel()

      expect(subscribeSpy).toHaveBeenCalledTimes(1)
      expect(unsubscribe).toHaveBeenCalledTimes(1)
      expect(setIntervalSpy).toHaveBeenCalledTimes(1)
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1)

      controller.abort()

      expect(unsubscribe).toHaveBeenCalledTimes(1)
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    } finally {
      subscribeSpy.mockRestore()
      setIntervalSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    }
  })

  it("does not subscribe for an unknown room request", async () => {
    const subscribeSpy = vi.spyOn(roomStore.events, "subscribe")

    try {
      const response = await GET(new Request("http://localhost/api/rooms/NOPE/events"), {
        params: { code: "NOPE" },
      })

      expect(response.status).toBe(404)
      expect(subscribeSpy).not.toHaveBeenCalled()
    } finally {
      subscribeSpy.mockRestore()
    }
  })

  it("cleans up the subscription and heartbeat when the request aborts", async () => {
    const room = roomStore.createRoom("session-abort-host", "Host")
    const controller = new AbortController()
    const request = new Request(`http://localhost/api/rooms/${room.code}/events`, {
      signal: controller.signal,
    })
    const unsubscribe = vi.fn()
    const subscribeSpy = vi.spyOn(roomStore.events, "subscribe").mockImplementation(() => unsubscribe)
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval")
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval")

    try {
      const response = await GET(request, { params: { code: room.code } })
      const reader = response.body?.getReader()

      expect(reader).toBeDefined()
      expect(await readChunk(reader!)).toContain('"version":0')

      controller.abort()

      expect(subscribeSpy).toHaveBeenCalledTimes(1)
      expect(unsubscribe).toHaveBeenCalledTimes(1)
      expect(setIntervalSpy).toHaveBeenCalledTimes(1)
      expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    } finally {
      subscribeSpy.mockRestore()
      setIntervalSpy.mockRestore()
      clearIntervalSpy.mockRestore()
    }
  })
})

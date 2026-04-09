import { describe, expect, it } from "vitest"

import { getOrCreateSessionId } from "@/lib/session"

describe("getOrCreateSessionId", () => {
  it("persists and reuses the session id", () => {
    globalThis.localStorage.clear()

    const firstSessionId = getOrCreateSessionId()
    const secondSessionId = getOrCreateSessionId()

    expect(firstSessionId).toBeTruthy()
    expect(secondSessionId).toBe(firstSessionId)
    expect(globalThis.localStorage.getItem("avalon-session-id")).toBe(firstSessionId)
  })
})

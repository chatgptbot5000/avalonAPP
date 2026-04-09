const SESSION_STORAGE_KEY = "avalon-session-id"

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `session-${Math.random().toString(36).slice(2, 10)}`
}

export function getOrCreateSessionId() {
  const existingSessionId = globalThis.localStorage?.getItem(SESSION_STORAGE_KEY)

  if (existingSessionId) {
    return existingSessionId
  }

  const nextSessionId = createSessionId()
  globalThis.localStorage?.setItem(SESSION_STORAGE_KEY, nextSessionId)
  return nextSessionId
}

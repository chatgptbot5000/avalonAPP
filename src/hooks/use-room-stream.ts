"use client"

import { useEffect, useState } from "react"

export function useRoomStream(roomCode: string, initialVersion = 0) {
  const [latestVersion, setLatestVersion] = useState(initialVersion)

  useEffect(() => {
    setLatestVersion((currentVersion) => (currentVersion < initialVersion ? initialVersion : currentVersion))

    if (!roomCode) {
      setLatestVersion(initialVersion)
    }
  }, [initialVersion, roomCode])

  useEffect(() => {
    if (!roomCode || typeof EventSource === "undefined") {
      return
    }

    const stream = new EventSource(`/api/rooms/${roomCode}/events`)

    stream.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { version?: number }

      if (typeof payload.version === "number") {
        setLatestVersion(payload.version)
      }
    }

    return () => {
      stream.close()
    }
  }, [roomCode])

  return latestVersion
}

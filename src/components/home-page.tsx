"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { postJson } from "@/lib/client-api"
import { getOrCreateSessionId } from "@/lib/session"

type RoomResponse = {
  room: {
    code: string
  }
}

export function HomePage() {
  const router = useRouter()
  const [name, setName] = useState("Player")
  const [roomCode, setRoomCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function createRoom() {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await postJson<RoomResponse>("/api/rooms", {
        sessionId: getOrCreateSessionId(),
        name: name.trim() || "Player",
      })

      router.push(`/room/${response.room.code}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create room")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function joinRoom() {
    const normalizedRoomCode = roomCode.trim().toUpperCase()

    if (!normalizedRoomCode) {
      setErrorMessage("Enter a room code to join a table.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await postJson<RoomResponse>(`/api/rooms/${normalizedRoomCode}/join`, {
        sessionId: getOrCreateSessionId(),
        name: name.trim() || "Player",
      })

      router.push(`/room/${normalizedRoomCode}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to join room")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "720px",
          border: "1px solid rgba(148, 163, 184, 0.25)",
          borderRadius: "24px",
          padding: "48px 32px",
          background: "rgba(15, 23, 42, 0.82)",
          textAlign: "center",
          boxShadow: "0 24px 80px rgba(2, 6, 23, 0.45)"
        }}
      >
        <h1 style={{ margin: "0 0 16px", fontSize: "3rem" }}>Avalon Web Game</h1>
        <p style={{ margin: "0 0 32px", color: "#cbd5e1" }}>
          Gather your party and launch a new match or jump into an existing room.
        </p>
        <div
          style={{
            display: "grid",
            gap: "16px",
            margin: "0 0 24px",
            textAlign: "left"
          }}
        >
          <label style={{ display: "grid", gap: "8px" }}>
            <span style={{ color: "#e2e8f0", fontSize: "0.95rem" }}>Display name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Player"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "rgba(15, 23, 42, 0.92)",
                color: "#f8fafc"
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "8px" }}>
            <span style={{ color: "#e2e8f0", fontSize: "0.95rem" }}>Room code</span>
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              placeholder="ABCD"
              maxLength={4}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: "14px",
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "rgba(15, 23, 42, 0.92)",
                color: "#f8fafc",
                letterSpacing: "0.16em"
              }}
            />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap"
          }}
        >
          <button type="button" onClick={createRoom} disabled={isSubmitting}>
            Create room
          </button>
          <button type="button" onClick={joinRoom} disabled={isSubmitting}>
            Join room
          </button>
        </div>
        {errorMessage ? <p style={{ margin: "24px 0 0", color: "#fda4af" }}>{errorMessage}</p> : null}
      </section>
    </main>
  )
}

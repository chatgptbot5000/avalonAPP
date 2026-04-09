import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { createElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { RoomPageClient, parseRoomResponse } from "../room-page-client"

vi.mock("@/hooks/use-room-stream", () => ({
  useRoomStream: () => 0,
}))

vi.mock("@/lib/session", () => ({
  getOrCreateSessionId: () => "session-123",
}))

const baseRoom = {
  code: "ABCD",
  version: 2,
  players: [
    { id: "p1", name: "Host", connected: true },
    { id: "p2", name: "Guest", connected: true },
    { id: "p3", name: "G3", connected: true },
    { id: "p4", name: "G4", connected: true },
    { id: "p5", name: "G5", connected: true },
  ],
  session: {
    playerId: "p1",
    isHost: true,
  },
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("parseRoomResponse", () => {
  it("returns the room snapshot from a successful payload", () => {
    expect(
      parseRoomResponse({
        room: {
          code: "ABCD",
          version: 3,
          players: [{ id: "p1", name: "Host", connected: true }],
          game: null,
        },
      }),
    ).toEqual({
      code: "ABCD",
      version: 3,
      players: [{ id: "p1", name: "Host", connected: true }],
      game: null,
    })
  })

  it("throws when the room payload is missing", () => {
    expect(() => parseRoomResponse({ error: "Unknown room" })).toThrow("Unknown room")
  })

  it("loads the room through rejoin so private state survives refresh", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          room: {
            ...baseRoom,
            game: {
              phase: "team-proposal",
              roundNumber: 1,
              questNumber: 1,
              leaderPlayerId: "p1",
              teamSize: 2,
              proposedTeam: [],
              publicHistory: [],
            },
            private: {
              role: "merlin",
              privateKnowledge: { seenPlayers: ["Guest"] },
              canVoteTeam: false,
              canVoteQuest: false,
              canPickMerlin: false,
              canProposeTeam: true,
            },
          },
        }),
      ),
    )

    render(createElement(RoomPageClient, { code: "ABCD" }))

    await screen.findByText(/you are the current leader/i)

    expect(fetchSpy).toHaveBeenCalledWith("/api/rooms/ABCD/rejoin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: "session-123" }),
    })
    expect(screen.getByText(/^merlin$/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^Guest$/i).length).toBeGreaterThan(0)
  })

  it("lets the host start from the live room page", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            room: {
              ...baseRoom,
              game: null,
              private: null,
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            room: {
              ...baseRoom,
              game: {
                phase: "team-proposal",
                roundNumber: 1,
                questNumber: 1,
                leaderPlayerId: "p1",
                teamSize: 2,
                proposedTeam: [],
                publicHistory: [],
              },
              private: {
                role: "merlin",
                privateKnowledge: { seenPlayers: ["Guest"] },
                canVoteTeam: false,
                canVoteQuest: false,
                canPickMerlin: false,
                canProposeTeam: true,
              },
            },
          }),
        ),
      )

    render(createElement(RoomPageClient, { code: "ABCD" }))

    fireEvent.click(await screen.findByRole("button", { name: /start game/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/rooms/ABCD/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "session-123" }),
      })
    })
  })

  it("submits a team vote from the current phase controls", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            room: {
              ...baseRoom,
              game: {
                phase: "team-vote",
                roundNumber: 1,
                questNumber: 1,
                leaderPlayerId: "p2",
                teamSize: 2,
                proposedTeam: ["p1", "p2"],
                publicHistory: [],
              },
              private: {
                role: "merlin",
                privateKnowledge: { seenPlayers: ["Guest"] },
                canVoteTeam: true,
                canVoteQuest: false,
                canPickMerlin: false,
                canProposeTeam: false,
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            room: {
              ...baseRoom,
              game: {
                phase: "team-vote",
                roundNumber: 1,
                questNumber: 1,
                leaderPlayerId: "p2",
                teamSize: 2,
                proposedTeam: ["p1", "p2"],
                publicHistory: [],
              },
              private: {
                role: "merlin",
                privateKnowledge: { seenPlayers: ["Guest"] },
                canVoteTeam: false,
                canVoteQuest: false,
                canPickMerlin: false,
                canProposeTeam: false,
              },
            },
          }),
        ),
      )

    render(createElement(RoomPageClient, { code: "ABCD" }))

    fireEvent.click(await screen.findByRole("button", { name: /approve team/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/rooms/ABCD/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "session-123",
          action: {
            type: "submit-team-vote",
            vote: "approve",
          },
        }),
      })
    })
  })

  it("submits a quest vote from the current phase controls", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            room: {
              ...baseRoom,
              game: {
                phase: "quest-vote",
                roundNumber: 1,
                questNumber: 1,
                leaderPlayerId: "p2",
                teamSize: 2,
                proposedTeam: ["p1", "p2"],
                publicHistory: [],
              },
              private: {
                role: "merlin",
                privateKnowledge: { seenPlayers: ["Guest"] },
                canVoteTeam: false,
                canVoteQuest: true,
                canPickMerlin: false,
                canProposeTeam: false,
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            room: {
              ...baseRoom,
              game: {
                phase: "team-proposal",
                roundNumber: 2,
                questNumber: 2,
                leaderPlayerId: "p2",
                teamSize: 3,
                proposedTeam: [],
                publicHistory: [{ questNumber: 1, outcome: "success", failCount: 0 }],
              },
              private: {
                role: "merlin",
                privateKnowledge: { seenPlayers: ["Guest"] },
                canVoteTeam: false,
                canVoteQuest: false,
                canPickMerlin: false,
                canProposeTeam: false,
              },
            },
          }),
        ),
      )

    render(createElement(RoomPageClient, { code: "ABCD" }))

    fireEvent.click(await screen.findByRole("button", { name: /play success/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/rooms/ABCD/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "session-123",
          action: {
            type: "submit-quest-vote",
            vote: "success",
          },
        }),
      })
    })
  })

  it("submits the assassin pick from the current phase controls", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            room: {
              ...baseRoom,
              game: {
                phase: "assassin-pick",
                roundNumber: 4,
                questNumber: 4,
                leaderPlayerId: "p2",
                teamSize: 3,
                proposedTeam: ["p1", "p2", "p3"],
                publicHistory: [],
              },
              private: {
                role: "assassin",
                privateKnowledge: { seenPlayers: ["Guest"] },
                canVoteTeam: false,
                canVoteQuest: false,
                canPickMerlin: true,
                canProposeTeam: false,
              },
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            room: {
              ...baseRoom,
              game: {
                phase: "game-over",
                roundNumber: 4,
                questNumber: 4,
                leaderPlayerId: "p2",
                teamSize: 3,
                proposedTeam: ["p1", "p2", "p3"],
                publicHistory: [],
                winner: "evil",
              },
              private: {
                role: "assassin",
                privateKnowledge: { seenPlayers: ["Guest"] },
                canVoteTeam: false,
                canVoteQuest: false,
                canPickMerlin: false,
                canProposeTeam: false,
              },
            },
          }),
        ),
      )

    render(createElement(RoomPageClient, { code: "ABCD" }))

    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "p2" } })
    fireEvent.click(screen.getByRole("button", { name: /confirm assassin pick/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/rooms/ABCD/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: "session-123",
          action: {
            type: "submit-assassin-pick",
            targetPlayerId: "p2",
          },
        }),
      })
    })
  })
})

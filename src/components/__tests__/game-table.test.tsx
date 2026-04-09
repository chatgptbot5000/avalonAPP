import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import RoomPage from "@/app/room/[code]/page"

import { GameTable } from "../game-table"

const roomPageClientSpy = vi.fn(({ code }: { code: string }) => <p>{code}</p>)

vi.mock("@/components/room-page-client", () => ({
  RoomPageClient: (props: { code: string }) => roomPageClientSpy(props),
}))

describe("GameTable", () => {
  it("shows the desktop roster, quest track, and lobby seat notes", () => {
    render(
      <GameTable
        room={{ code: "ABCD", players: [{ id: "p1", name: "Host", connected: true }], game: null }}
        privateView={null}
      />,
    )

    expect(screen.getByText(/room abcd/i)).toBeInTheDocument()
    expect(screen.getByText(/players/i)).toBeInTheDocument()
    expect(screen.getByText(/quest track/i)).toBeInTheDocument()
    expect(screen.getByText(/current action/i)).toBeInTheDocument()
    expect(screen.getByText(/waiting for the host/i)).toBeInTheDocument()
    expect(screen.getByText(/^lobby$/i)).toBeInTheDocument()
    expect(screen.getByText(/private role information will appear here after the game starts/i)).toBeInTheDocument()
  })

  it("normalizes the room code on the room page", () => {
    roomPageClientSpy.mockClear()

    render(<RoomPage params={{ code: "abcz" }} />)

    expect(roomPageClientSpy).toHaveBeenCalledWith({ code: "ABCZ" })
    expect(screen.getByText("ABCZ")).toBeInTheDocument()
  })

  it("swaps the lobby panel for the final reveal and shows private seat notes", () => {
    render(
      <GameTable
        room={{
          code: "WXYZ",
          players: [{ id: "p1", name: "Host", connected: true }],
          game: {
            phase: "game-over",
            roundNumber: 5,
            questNumber: 5,
            leaderPlayerId: "p1",
            teamSize: 3,
            proposedTeam: ["p1"],
            publicHistory: [{ questNumber: 1, outcome: "success", failCount: 0 }],
            winner: "good",
          },
        }}
        privateView={{
          role: "loyal-servant",
          privateKnowledge: ["Trust Merlin's instincts"],
          canVoteTeam: false,
          canVoteQuest: false,
          canPickMerlin: false,
        }}
      />,
    )

    expect(screen.queryByText(/^lobby$/i)).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^final reveal$/i })).toBeInTheDocument()
    expect(screen.getByText(/the match is over and the table can compare loyalties/i)).toBeInTheDocument()
    expect(screen.getByText(/^loyal servant$/i)).toBeInTheDocument()
    expect(screen.getByText(/trust merlin's instincts/i)).toBeInTheDocument()
  })
})

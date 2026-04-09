import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import RoomPage from "@/app/room/[code]/page"

import { GameTable } from "../game-table"

const roomPageClientSpy = vi.fn(({ code }: { code: string }) => <p>{code}</p>)

vi.mock("@/components/room-page-client", () => ({
  RoomPageClient: (props: { code: string }) => roomPageClientSpy(props),
}))

describe("GameTable", () => {
  const noopAsync = async () => undefined

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

  it("opens and closes the instructions modal", () => {
    render(
      <GameTable
        room={{ code: "ABCD", players: [{ id: "p1", name: "Host", connected: true }], game: null }}
        privateView={null}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /instructions/i }))

    expect(screen.getByRole("dialog", { name: /how to play avalon/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^merlin$/i })).toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /close instructions/i }))

    fireEvent.keyDown(screen.getByRole("dialog", { name: /how to play avalon/i }), { key: "Escape" })

    expect(screen.queryByRole("dialog", { name: /how to play avalon/i })).not.toBeInTheDocument()
  })

  it("links to the full instructions pdf", () => {
    render(
      <GameTable
        room={{ code: "ABCD", players: [{ id: "p1", name: "Host", connected: true }], game: null }}
        privateView={null}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /instructions/i }))

    const link = screen.getByRole("link", { name: /full instructions/i })

    expect(link).toHaveAttribute("href", "https://avalon.fun/pdfs/rules.pdf")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("shows the approved quest team in the quest tracker", () => {
    render(
      <GameTable
        room={{
          code: "ABCD",
          players: [
            { id: "p1", name: "Host", connected: true },
            { id: "p2", name: "Scout", connected: true },
            { id: "p3", name: "Knight", connected: true },
          ],
          game: {
            phase: "quest-vote",
            roundNumber: 1,
            questNumber: 1,
            leaderPlayerId: "p1",
            teamSize: 2,
            proposedTeam: ["p1", "p2"],
            approvedTeam: ["Host", "Scout"],
            publicHistory: [],
          },
        }}
        privateView={null}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /show team/i }))

    expect(screen.getByText(/^host, scout$/i)).toBeInTheDocument()
  })

  it("shows role summaries and swaps to advanced instructions", () => {
    render(
      <GameTable
        room={{ code: "ABCD", players: [{ id: "p1", name: "Host", connected: true }], game: null }}
        privateView={null}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /instructions/i }))

    expect(screen.getByRole("heading", { name: /^merlin$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^assassin$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^percival$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^morgana$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^mordred$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^oberon$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^loyal servant$/i })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^minion$/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /advanced/i }))

    expect(screen.getByText(/mission wins are public/i)).toBeInTheDocument()
    expect(screen.getByText(/^role reveal:/i)).toBeInTheDocument()
    expect(screen.getByText(/^lobby:/i)).toBeInTheDocument()
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
            publicHistory: [{ questNumber: 1, outcome: "success", failCount: 0, teamMembers: ["Host"] }],
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

  it("shows every player's role in the final reveal and lets the host play again", () => {
    render(
      <GameTable
        room={{
          code: "WXYZ",
          players: [
            { id: "p1", name: "Host", connected: true },
            { id: "p2", name: "Scout", connected: true },
          ],
          game: {
            phase: "game-over",
            roundNumber: 5,
            questNumber: 5,
            leaderPlayerId: "p1",
            teamSize: 3,
            proposedTeam: ["p1"],
            approvedTeam: [],
            publicHistory: [],
            winner: "evil",
            finalReveal: [
              { playerId: "p1", playerName: "Host", role: "merlin" },
              { playerId: "p2", playerName: "Scout", role: "assassin" },
            ],
          },
        }}
        privateView={null}
        session={{ playerId: "p1", isHost: true }}
        onPlayAgain={noopAsync}
      />,
    )

    expect(screen.getByRole("heading", { name: /^host$/i })).toBeInTheDocument()
    expect(screen.getByText(/^merlin$/i)).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /^scout$/i })).toBeInTheDocument()
    expect(screen.getByText(/^assassin$/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /play again/i })).toBeInTheDocument()
  })
})

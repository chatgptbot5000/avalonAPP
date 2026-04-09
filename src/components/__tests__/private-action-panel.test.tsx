import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PrivateActionPanel } from "../private-action-panel"

describe("PrivateActionPanel", () => {
  it("shows role reveal content during role reveal", () => {
    render(
      <PrivateActionPanel
        gamePhase="role-reveal"
        privateView={{
          role: "merlin",
          privateKnowledge: { seenPlayers: ["p2", "p4"] },
          canProposeTeam: false,
          canVoteTeam: false,
          canVoteQuest: false,
          canPickMerlin: false,
        }}
      />,
    )

    expect(screen.getByText(/you are merlin/i)).toBeInTheDocument()
  })

  it("shows fallback content when private role data is unavailable", () => {
    render(<PrivateActionPanel gamePhase="lobby" privateView={null} />)

    expect(screen.getByText(/waiting for the host/i)).toBeInTheDocument()
    expect(screen.getByText(/the host can review the table and start when everyone is seated/i)).toBeInTheDocument()
  })

  it("only offers a success card to good quest voters", () => {
    render(
      <PrivateActionPanel
        room={{
          players: [
            { id: "p1", name: "Host", connected: true },
            { id: "p2", name: "Guest", connected: true },
          ],
          game: {
            phase: "quest-vote",
            teamSize: 2,
            proposedTeam: ["p1", "p2"],
          },
        }}
        gamePhase="quest-vote"
        session={{ playerId: "p1", isHost: true }}
        privateView={{
          role: "merlin",
          privateKnowledge: { seenPlayers: ["Guest"] },
          canProposeTeam: false,
          canVoteTeam: false,
          canVoteQuest: true,
          canPickMerlin: false,
        }}
      />,
    )

    expect(screen.getByRole("button", { name: /play success/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /play fail/i })).not.toBeInTheDocument()
  })

  it("shows an assassin target picker during the final phase", () => {
    render(
      <PrivateActionPanel
        room={{
          players: [
            { id: "p1", name: "Assassin", connected: true },
            { id: "p2", name: "Merlin?", connected: true },
          ],
          game: {
            phase: "assassin-pick",
            teamSize: 2,
            proposedTeam: [],
          },
        }}
        gamePhase="assassin-pick"
        session={{ playerId: "p1", isHost: false }}
        privateView={{
          role: "assassin",
          privateKnowledge: { seenPlayers: ["Merlin?"] },
          canProposeTeam: false,
          canVoteTeam: false,
          canVoteQuest: false,
          canPickMerlin: true,
        }}
      />,
    )

    expect(screen.getByRole("button", { name: /confirm assassin pick/i })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /merlin\?/i })).toBeInTheDocument()
  })
})

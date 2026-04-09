import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { HomePage } from "@/components/home-page"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe("HomePage", () => {
  it("shows create and join actions", () => {
    render(<HomePage />)

    expect(
      screen.getByRole("heading", { name: /avalon web game/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /create room/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /join room/i })).toBeInTheDocument()
  })
})

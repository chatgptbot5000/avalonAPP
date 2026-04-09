import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import Page from "./page"

describe("Preview page", () => {
  it("shows a sample room table for local review", () => {
    render(<Page />)

    expect(screen.getByRole("heading", { name: /preview table/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /instructions/i })).toBeInTheDocument()
  })
})

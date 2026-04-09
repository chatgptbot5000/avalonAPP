import { describe, expect, it, vi } from "vitest"

import { postJson } from "@/lib/client-api"

describe("postJson", () => {
  it("posts JSON and returns the parsed response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ room: { code: "ABCD" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )

    try {
      await expect(postJson("/api/rooms", { name: "Host" })).resolves.toEqual({ room: { code: "ABCD" } })
      expect(fetchSpy).toHaveBeenCalledWith("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Host" }),
      })
    } finally {
      fetchSpy.mockRestore()
    }
  })

  it("throws the server error message for failed requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Unknown room" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }),
    )

    try {
      await expect(postJson("/api/rooms/NOPE/join", { name: "Guest" })).rejects.toThrow("Unknown room")
    } finally {
      fetchSpy.mockRestore()
    }
  })
})

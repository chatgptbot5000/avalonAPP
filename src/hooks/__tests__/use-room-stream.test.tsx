import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useRoomStream } from "@/hooks/use-room-stream"

type EventSourceInstance = {
  close: ReturnType<typeof vi.fn>
  onmessage: ((event: MessageEvent<string>) => void) | null
  url: string
}

describe("useRoomStream", () => {
  it("keeps one EventSource subscription when the version changes", () => {
    const instances: EventSourceInstance[] = []

    const EventSourceMock = vi.fn((url: string) => {
      const instance: EventSourceInstance = {
        close: vi.fn(),
        onmessage: null,
        url,
      }
      instances.push(instance)
      return instance
    })

    vi.stubGlobal("EventSource", EventSourceMock)

    function TestHarness({ initialVersion }: { initialVersion: number }) {
      const latestVersion = useRoomStream("ABCD", initialVersion)
      return <p>{latestVersion}</p>
    }

    const { rerender, unmount } = render(<TestHarness initialVersion={0} />)

    expect(EventSourceMock).toHaveBeenCalledTimes(1)
    expect(screen.getByText("0")).toBeInTheDocument()

    act(() => {
      instances[0].onmessage?.({ data: JSON.stringify({ version: 1 }) } as MessageEvent<string>)
    })

    expect(screen.getByText("1")).toBeInTheDocument()

    act(() => {
      rerender(<TestHarness initialVersion={1} />)
    })

    expect(EventSourceMock).toHaveBeenCalledTimes(1)

    unmount()

    expect(instances[0].close).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it("leaves the initial version alone when EventSource is unavailable", () => {
    vi.unstubAllGlobals()

    function TestHarness() {
      const latestVersion = useRoomStream("ABCD", 2)
      return <p>{latestVersion}</p>
    }

    render(<TestHarness />)

    expect(screen.getByText("2")).toBeInTheDocument()
  })
})

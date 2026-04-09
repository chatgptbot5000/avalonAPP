type RoomListener = (version: number) => void

export function createRoomEvents() {
  const listeners = new Map<string, Set<RoomListener>>()

  return {
    subscribe(roomCode: string, listener: RoomListener) {
      const roomListeners = listeners.get(roomCode) ?? new Set<RoomListener>()
      roomListeners.add(listener)
      listeners.set(roomCode, roomListeners)

      return () => {
        roomListeners.delete(listener)

        if (roomListeners.size === 0) {
          listeners.delete(roomCode)
        }
      }
    },
    publish(roomCode: string, version: number) {
      listeners.get(roomCode)?.forEach((listener) => {
        listener(version)
      })
    },
  }
}

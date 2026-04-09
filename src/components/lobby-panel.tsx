import type { GameTableRoom } from "./game-table"

type LobbyPanelProps = {
  room: GameTableRoom
}

export function LobbyPanel({ room }: LobbyPanelProps) {
  return (
    <section className="panel-surface panel-inset" aria-labelledby="lobby-heading">
      <p className="eyebrow">Before the Vote</p>
      <h2 id="lobby-heading">Lobby</h2>
      <p>{room.players.length} player{room.players.length === 1 ? "" : "s"} gathered at the table.</p>
      <p className="muted-copy">Invite the remaining seats, confirm everyone is connected, then let the host start.</p>
    </section>
  )
}

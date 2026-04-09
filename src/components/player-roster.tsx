type Player = {
  id: string
  name: string
  connected: boolean
}

type PlayerRosterProps = {
  players: Player[]
  leaderPlayerId: string | null
}

export function PlayerRoster({ players, leaderPlayerId }: PlayerRosterProps) {
  return (
    <section className="panel-surface roster-panel" aria-labelledby="players-heading">
      <p className="eyebrow">Seats</p>
      <h2 id="players-heading">Players</h2>
      <ul className="roster-list">
        {players.map((player) => (
          <li key={player.id} className="roster-item">
            <div>
              <strong>{player.name}</strong>
              {leaderPlayerId === player.id ? <span className="leader-chip">Leader</span> : null}
            </div>
            <span className={player.connected ? "status-pill is-connected" : "status-pill"}>
              {player.connected ? "Connected" : "Away"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

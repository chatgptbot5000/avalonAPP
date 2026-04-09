import type { GameWinner, Role } from "@/types/game"

type FinalRevealPanelProps = {
  game: {
    winner?: GameWinner
    finalReveal?: Array<{
      playerId: string
      playerName: string
      role: Role
    }>
  }
  isHost: boolean
  onPlayAgain?: () => Promise<void>
}

export function FinalRevealPanel({ game, isHost, onPlayAgain }: FinalRevealPanelProps) {
  const winnerLabel = game.winner === "good" ? "Loyal servants prevail" : game.winner === "evil" ? "The shadows take the realm" : "No winner yet"

  return (
    <section className="panel-surface panel-inset" aria-labelledby="final-reveal-heading">
      <p className="eyebrow">Aftermath</p>
      <h2 id="final-reveal-heading">Final Reveal</h2>
      <p>{winnerLabel}</p>
      <p className="muted-copy">Use this panel to recap the last turn and compare hidden roles.</p>

      {game.finalReveal?.length ? (
        <ul className="final-reveal-list">
          {game.finalReveal.map((entry) => (
            <li key={entry.playerId} className="final-reveal-card">
              <h3>{entry.playerName}</h3>
              <p>{entry.role.replace(/-/g, " ")}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {isHost && onPlayAgain ? (
        <button type="button" onClick={() => void onPlayAgain()}>
          Play Again
        </button>
      ) : null}
    </section>
  )
}

import type { GameWinner } from "@/types/game"

type FinalRevealPanelProps = {
  game: {
    winner?: GameWinner
  }
}

export function FinalRevealPanel({ game }: FinalRevealPanelProps) {
  const winnerLabel = game.winner === "good" ? "Loyal servants prevail" : game.winner === "evil" ? "The shadows take the realm" : "No winner yet"

  return (
    <section className="panel-surface panel-inset" aria-labelledby="final-reveal-heading">
      <p className="eyebrow">Aftermath</p>
      <h2 id="final-reveal-heading">Final Reveal</h2>
      <p>{winnerLabel}</p>
      <p className="muted-copy">Use this panel to recap the last turn and compare hidden roles.</p>
    </section>
  )
}

import { GameTable } from "@/components/game-table"

const previewRoom = {
  code: "PREVIEW",
  players: [
    { id: "p1", name: "Merlin", connected: true },
    { id: "p2", name: "Percival", connected: true },
    { id: "p3", name: "Morgana", connected: true },
  ],
  game: null,
}

export default function PreviewPage() {
  return (
    <div className="preview-page">
      <section className="preview-page__intro panel-surface">
        <p className="eyebrow">Local preview</p>
        <h1>Preview Table</h1>
        <p className="muted-copy">Use this route to review the table layout and open the instructions modal.</p>
      </section>

      <GameTable room={previewRoom} privateView={null} session={null} />
    </div>
  )
}

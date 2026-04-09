import type { QuestOutcome } from "@/types/game"

type QuestHistoryEntry = {
  questNumber: number
  outcome: QuestOutcome
  failCount: number
}

type QuestTrackProps = {
  history: QuestHistoryEntry[]
  currentQuest: number
}

const QUEST_SLOTS = [1, 2, 3, 4, 5]

export function QuestTrack({ history, currentQuest }: QuestTrackProps) {
  return (
    <section className="panel-surface panel-inset" aria-labelledby="quest-track-heading">
      <p className="eyebrow">Campaign</p>
      <h2 id="quest-track-heading">Quest Track</h2>
      <ol className="quest-track">
        {QUEST_SLOTS.map((questNumber) => {
          const result = history.find((entry) => entry.questNumber === questNumber)
          const stateClass = result
            ? result.outcome === "success"
              ? "is-success"
              : "is-fail"
            : currentQuest === questNumber
              ? "is-current"
              : ""

          return (
            <li key={questNumber} className={`quest-stop ${stateClass}`.trim()}>
              <span className="quest-stop__number">{questNumber}</span>
              <span className="quest-stop__label">{result ? result.outcome : questNumber === currentQuest ? "Current" : "Waiting"}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

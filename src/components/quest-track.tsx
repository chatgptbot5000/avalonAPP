import { useState } from "react"

import type { QuestOutcome } from "@/types/game"

type QuestHistoryEntry = {
  questNumber: number
  outcome: QuestOutcome
  failCount: number
  teamMembers?: string[]
}

type QuestTrackProps = {
  history: QuestHistoryEntry[]
  currentQuest: number
  currentTeam?: string[]
}

const QUEST_SLOTS = [1, 2, 3, 4, 5]

function QuestTeamPopover({ names }: { names: string[] }) {
  const [open, setOpen] = useState(false)

  if (names.length === 0) {
    return null
  }

  return (
    <div className="quest-team">
      <button type="button" className="quest-team__toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        Show team
      </button>
      {open ? <div className="quest-team__popover">{names.join(", ")}</div> : null}
    </div>
  )
}

export function QuestTrack({ history, currentQuest, currentTeam = [] }: QuestTrackProps) {
  return (
    <section className="panel-surface panel-inset" aria-labelledby="quest-track-heading">
      <p className="eyebrow">Campaign</p>
      <h2 id="quest-track-heading">Quest Track</h2>
      <ol className="quest-track">
        {QUEST_SLOTS.map((questNumber) => {
          const result = history.find((entry) => entry.questNumber === questNumber)
          const teamMembers = result?.teamMembers ?? (questNumber === currentQuest ? currentTeam : [])
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
              <QuestTeamPopover names={teamMembers} />
            </li>
          )
        })}
      </ol>
    </section>
  )
}

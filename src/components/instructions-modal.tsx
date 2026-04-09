"use client"

import { useEffect, useRef, useState } from "react"
import type { KeyboardEvent, ReactNode } from "react"

type InstructionsModalProps = {
  open: boolean
  onClose: () => void
}

const PHASES = [
  "Lobby: host starts once 5-10 players are seated.",
  "Team proposal: the leader picks the quest team.",
  "Team vote: everyone approves or rejects the team.",
  "Quest vote: quest members secretly play success/fail.",
  "Assassin pick: if good reaches 3 wins, the assassin names Merlin.",
]

const ROLE_GUIDES = [
  {
    role: "Merlin",
    goal: "Protect the team by spotting evil without being too obvious.",
    ability: "Sees most evil players at setup, but not Mordred or Oberon.",
  },
  {
    role: "Assassin",
    goal: "Keep evil alive long enough to identify and remove Merlin.",
    ability: "Knows the evil team and makes the final Merlin pick if evil gets there.",
  },
  {
    role: "Percival",
    goal: "Help good by finding Merlin and supporting the right teams.",
    ability: "Sees the players who might be Merlin or Morgana.",
  },
  {
    role: "Morgana",
    goal: "Mislead Percival and help evil stay hidden.",
    ability: "Appears as Merlin to Percival-style knowledge.",
  },
  {
    role: "Mordred",
    goal: "Stay hidden from Merlin while helping evil win quests.",
    ability: "Merlin cannot see Mordred at setup.",
  },
  {
    role: "Oberon",
    goal: "Support evil while staying out of their early coordination.",
    ability: "Does not appear in the evil team knowledge pool.",
  },
  {
    role: "Loyal Servant",
    goal: "Help good by reading the table and voting honestly.",
    ability: "No special knowledge at setup.",
  },
  {
    role: "Minion",
    goal: "Help evil win quests and protect the assassin path.",
    ability: "Sees the other evil players at setup, but not itself.",
  },
]

const ADVANCED_PHASES = [
  "Role reveal: every seat learns its role and any special knowledge before the first proposal.",
  "Lobby: the host can only start once the table is full enough for the chosen player count.",
  "Team proposal: the leader picks exactly the required number of players for the current quest.",
  "Team vote: all players approve or reject the team; too many rejections move the leader to the next seat.",
  "Quest vote: only the quest team votes, and good can only play success while evil may play fail.",
  "Quest result: mission wins are public, and the quest track updates after the cards are resolved.",
  "Assassin pick: if good reaches 3 wins, the assassin names Merlin to try to steal the game.",
]

function Bullet({ children }: { children: ReactNode }) {
  return <li className="instructions-modal__item">{children}</li>
}

export function InstructionsModal({ open, onClose }: InstructionsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const [view, setView] = useState<"basic" | "advanced">("basic")

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setView("basic")
    }
  }, [open])

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== "Tab") {
      return
    }

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )

    if (!focusableElements || focusableElements.length === 0) {
      event.preventDefault()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    const activeElement = document.activeElement

    if (event.shiftKey) {
      if (activeElement === firstElement || !dialogRef.current?.contains(activeElement)) {
        event.preventDefault()
        lastElement.focus()
      }
      return
    }

    if (activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="instructions-modal__backdrop" role="presentation" onClick={onClose}>
      <section
        className="instructions-modal panel-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="instructions-title"
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="instructions-modal__header">
          <div>
            <p className="eyebrow">Game guide</p>
            <h2 id="instructions-title">{view === "basic" ? "How to play Avalon" : "Advanced Avalon Guide"}</h2>
          </div>
          <div className="instructions-modal__actions">
            <button type="button" onClick={() => setView((current) => (current === "basic" ? "advanced" : "basic"))}>
              {view === "basic" ? "Advanced" : "Back"}
            </button>
            <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close instructions">
              Close
            </button>
          </div>
        </div>

        {view === "basic" ? (
          <>
            <p className="instructions-modal__lede">
              Keep the game moving by following the current phase. Hidden roles stay private until the final reveal.
            </p>

            <div className="instructions-modal__section">
              <h3>Roles</h3>
              <div className="instructions-modal__roles">
                {ROLE_GUIDES.map((role) => (
                  <article key={role.role} className="instructions-modal__role-card">
                    <h4>{role.role}</h4>
                    <p>{role.goal}</p>
                    <p className="muted-copy">{role.ability}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="instructions-modal__notes">
              <strong>Quick reminders:</strong>
              <ul>
                <li>Good team wants 3 successful quests.</li>
                <li>Evil team wants to stall or force the assassin phase.</li>
                <li>Only quest members vote on quest cards.</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <p className="instructions-modal__lede">
              Follow the table flow closely. Each phase ends as soon as the required votes land.
            </p>

            <ul className="instructions-modal__list">
              {ADVANCED_PHASES.map((phase) => (
                <Bullet key={phase}>{phase}</Bullet>
              ))}
            </ul>

            <div className="instructions-modal__notes">
              <strong>Advanced reminders:</strong>
              <ul>
                <li>The quest team is the only group that can affect a quest result.</li>
                <li>A failed team vote advances the leader and increases pressure on the table.</li>
                <li>The assassin only acts after the good team reaches 3 quest wins.</li>
              </ul>
            </div>
          </>
        )}

        <footer className="instructions-modal__footer">
          <a href="https://avalon.fun/pdfs/rules.pdf" target="_blank" rel="noreferrer">
            FULL INSTRUCTIONS
          </a>
        </footer>
      </section>
    </div>
  )
}

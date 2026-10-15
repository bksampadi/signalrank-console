import { useState } from 'react'
import type { SubmitEvent } from 'react'

import type { RetrievalMode } from '../api/signalrank'

import { Turnstile } from './Turnstile'

export type QuerySubmission = {
  query: string
  mode: RetrievalMode
  topK: number
  turnstileToken: string
}

type QueryFormProps = {
  onSubmit: (submission: QuerySubmission) => void | Promise<void>
  isSubmitting?: boolean
}

export function QueryForm({
  onSubmit,
  isSubmitting = false,
}: QueryFormProps) {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<RetrievalMode>('hybrid')
  const [topK, setTopK] = useState(5)

  const [turnstileToken, setTurnstileToken] = useState('')
  const [resetCount, setResetCount] = useState(0)

  const trimmedQuery = query.trim()
  const validTopK = Number.isInteger(topK) && topK >= 1 && topK <= 10

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
  event.preventDefault()

  if (
    !trimmedQuery ||
    !validTopK ||
    !turnstileToken ||
    isSubmitting
  ) {
    return
  }

  const token = turnstileToken

  // Turnstile tokens are single-use.
  setTurnstileToken('')

  try {
    await onSubmit({
      query: trimmedQuery,
      mode,
      topK,
      turnstileToken: token,
    })
  } finally {
    setResetCount((count) => count + 1)
  }
}

  return (
    <form className="query-form" onSubmit={handleSubmit}>
      <label className="query-form__label" htmlFor="query">
        Query
      </label>

      <textarea
        id="query"
        className="query-form__input"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Ask a question about the indexed evidence..."
        rows={4}
        maxLength={500}
        disabled={isSubmitting}
      />

      <div className="query-form__controls">
        <label>
          <span>Retrieval mode</span>
          <select
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as RetrievalMode)
            }
            disabled={isSubmitting}
          >
            <option value="hybrid">Hybrid</option>
            <option value="dense">Dense</option>
            <option value="bm25">BM25</option>
          </select>
        </label>

        <label>
          <span>Top K</span>
          <input
            type="number"
            min={1}
            max={10}
            value={topK}
            onChange={(event) => setTopK(Number(event.target.value))}
            disabled={isSubmitting}
          />
        </label>
      </div>

      <Turnstile
        onVerify={setTurnstileToken}
        resetCount={resetCount}
      />

      <div className="query-form__actions">
        <span className="query-form__hint">
          Retrieve ranked evidence directly from SignalRank-RAG.
        </span>

        <button
          type="submit"
          disabled={!trimmedQuery || !validTopK || !turnstileToken || isSubmitting}
        >
          {isSubmitting ? 'Retrieving…' : 'Run query'}
        </button>
      </div>
    </form>
  )
}
import { useState } from 'react'
import type { SubmitEvent } from 'react'

type QueryFormProps = {
  onSubmit: (query: string) => void
}

export function QueryForm({ onSubmit }: QueryFormProps) {
  const [query, setQuery] = useState('')

  const trimmedQuery = query.trim()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedQuery) {
      return
    }

    onSubmit(trimmedQuery)
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
      />

      <div className="query-form__actions">
        <span className="query-form__hint">
          SignalRank-RAG integration comes next.
        </span>

        <button type="submit" disabled={!trimmedQuery}>
          Run query
        </button>
      </div>
    </form>
  )
}
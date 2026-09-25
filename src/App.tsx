import { useState } from 'react'
import './App.css'
import { QueryForm } from './components/QueryForm'
import { ServiceStatus } from './components/ServiceStatus'

function App() {
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null)

  function handleQuerySubmit(query: string) {
    setSubmittedQuery(query)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="app-header__eyebrow">SignalRank</p>
          <h1>Evidence you can inspect.</h1>
          <p className="app-header__description">
            Query SignalRank-RAG and inspect the evidence behind each answer.
          </p>
        </div>

        <ServiceStatus status="not-connected" />
      </header>

      <main className="app-main">
        <section className="panel" aria-labelledby="query-heading">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Query</p>
              <h2 id="query-heading">Ask SignalRank</h2>
            </div>
          </div>

          <QueryForm onSubmit={handleQuerySubmit} />
        </section>

        <section className="panel" aria-labelledby="result-heading">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Result</p>
              <h2 id="result-heading">Answer and evidence</h2>
            </div>
          </div>

          {submittedQuery ? (
            <div className="empty-state">
              <p className="empty-state__title">API not connected yet</p>
              <p>
                The query was captured locally, but nothing has been sent to
                SignalRank-RAG.
              </p>
              <blockquote>{submittedQuery}</blockquote>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">No query has been run yet.</p>
              <p>
                Enter a question above. Answer retrieval will be connected in
                the next implementation slice.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
import { useEffect, useState } from 'react'

import './App.css'

import {
  checkSignalRankHealth,
  isSignalRankConfigured,
  retrieveSignalRankEvidence,
  type RetrieveResponse,
} from './api/signalrank'
import {
  QueryForm,
  type QuerySubmission,
} from './components/QueryForm'
import {
  ServiceStatus,
  type ServiceStatusValue,
} from './components/ServiceStatus'

function App() {
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null)
  const [retrievalResult, setRetrievalResult] =
    useState<RetrieveResponse | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [isQuerying, setIsQuerying] = useState(false)

  const [serviceStatus, setServiceStatus] = useState<ServiceStatusValue>(() =>
    isSignalRankConfigured() ? 'checking' : 'not-connected',
  )

  useEffect(() => {
    if (!isSignalRankConfigured()) {
      return
    }

    const controller = new AbortController()

    void checkSignalRankHealth(controller.signal)
      .then(() => {
        setServiceStatus('online')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setServiceStatus('offline')
      })

    return () => {
      controller.abort()
    }
  }, [])

  async function handleQuerySubmit({
    query,
    mode,
    topK,
    turnstileToken,
  }: QuerySubmission) {
    setSubmittedQuery(query)
    setRetrievalResult(null)
    setQueryError(null)
    setIsQuerying(true)

    try {
      const response = await retrieveSignalRankEvidence({
        query,
        mode,
        top_k: topK,
        turnstile_token: turnstileToken,
      })

      setRetrievalResult(response)
    } catch (error: unknown) {
      setQueryError(
        error instanceof Error
          ? error.message
          : 'SignalRank retrieval failed',
      )
    } finally {
      setIsQuerying(false)
    }
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

        <ServiceStatus status={serviceStatus} />
      </header>

      <main className="app-main">
        <section className="panel" aria-labelledby="query-heading">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Query</p>
              <h2 id="query-heading">Ask SignalRank</h2>
            </div>
          </div>

          <QueryForm
            onSubmit={handleQuerySubmit}
            isSubmitting={isQuerying}
          />
        </section>

        <section className="panel" aria-labelledby="result-heading">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Result</p>
              <h2 id="result-heading">Ranked evidence</h2>
            </div>
          </div>

          {isQuerying ? (
            <div className="empty-state" role="status">
              <p className="empty-state__title">
                Retrieving evidence…
              </p>
              <p>SignalRank is searching and ranking the corpus.</p>
            </div>
          ) : queryError ? (
            <div className="empty-state" role="alert">
              <p className="empty-state__title">
                Evidence retrieval unavailable
              </p>
              <p>{queryError}</p>

              {submittedQuery && <blockquote>{submittedQuery}</blockquote>}
            </div>
          ) : retrievalResult ? (
            retrievalResult.results.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state__title">
                  No evidence retrieved
                </p>
                <p>
                  SignalRank returned no evidence for this query and
                  retrieval configuration.
                </p>
                <blockquote>{retrievalResult.query}</blockquote>
              </div>
            ) : (
              <div className="retrieval-result">
                <div className="retrieval-result__summary">
                  <span>
                    Mode: <strong>{retrievalResult.mode}</strong>
                  </span>
                  <span>
                    {retrievalResult.results.length}{' '}
                    {retrievalResult.results.length === 1
                      ? 'result'
                      : 'results'}
                  </span>
                </div>

                <div className="evidence-list">
                  {retrievalResult.results.map((result) => (
                    <article
                      className="evidence-card"
                      key={`${result.doc_id}:${result.chunk_id}`}
                    >
                      <div className="evidence-card__header">
                        <div>
                          <span className="evidence-card__rank">
                            #{result.rank}
                          </span>
                          <span>{result.source_path}</span>
                        </div>

                        <span className="evidence-card__score">
                          Score {result.score.toFixed(4)}
                        </span>
                      </div>

                      <p className="evidence-card__text">
                        {result.text}
                      </p>

                      <div className="evidence-card__ids">
                        <span>Document: {result.doc_id}</span>
                        <span>Chunk: {result.chunk_id}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          ) : (
            <div className="empty-state">
              <p className="empty-state__title">
                No query has been run yet.
              </p>
              <p>
                Enter a question above to retrieve ranked evidence from
                SignalRank-RAG.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
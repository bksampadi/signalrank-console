const apiBaseUrl = import.meta.env.VITE_SIGNALRANK_API_BASE_URL
  ?.trim()
  .replace(/\/+$/, '')

export type RetrievalMode = 'bm25' | 'dense' | 'hybrid'

export type SearchResult = {
  chunk_id: string
  doc_id: string
  text: string
  score: number
  rank: number
  source_path: string
  metadata: Record<string, unknown>
}

export type RetrieveRequest = {
  query: string
  mode: RetrievalMode
  top_k: number
  turnstile_token: string
}

export type RetrieveResponse = {
  query: string
  mode: RetrievalMode
  results: SearchResult[]
}

export function isSignalRankConfigured() {
  return Boolean(apiBaseUrl)
}

export async function checkSignalRankHealth(
  signal?: AbortSignal,
): Promise<void> {
  if (!apiBaseUrl) {
    throw new Error('SignalRank API base URL is not configured')
  }

  const response = await fetch(`${apiBaseUrl}/health`, {
    signal,
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`)
  }

  const contentType = response.headers.get('content-type')

  if (!contentType?.includes('application/json')) {
    throw new Error('Health endpoint did not return JSON')
  }

  const data: unknown = await response.json()

  if (
    typeof data !== 'object' ||
    data === null ||
    !('status' in data) ||
    data.status !== 'ok'
  ) {
    throw new Error('Invalid API health response')
  }
}

export async function retrieveSignalRankEvidence(
  request: RetrieveRequest,
  signal?: AbortSignal,
): Promise<RetrieveResponse> {
  if (!apiBaseUrl) {
    throw new Error('SignalRank API base URL is not configured')
  }

  const response = await fetch(`${apiBaseUrl}/retrieve`,{
    method: 'POST',
    signal,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const detail = await response.text()

    throw new Error(
      `Retrieval request failed with status ${response.status}${
        detail ? `: ${detail}` : ''
      }`,
    )
  }

  return (await response.json()) as RetrieveResponse
}
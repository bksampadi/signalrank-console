export type RetrievalMode = 'bm25' | 'dense' | 'hybrid'

export type ValidatedRetrieveRequest = {
  query: string
  mode: RetrievalMode
  top_k: number
}

export function validateRetrieveRequest(
  input: unknown,
): ValidatedRetrieveRequest {

  if (
    typeof input !== 'object' ||
    input === null ||
    Array.isArray(input)
  ) {
    throw new Error('Request must be a JSON object')
  }

  const data = input as Record<string, unknown>

  // Validate query
  if (typeof data.query !== 'string') {
    throw new Error('Query must be a string')
  }

  const query = data.query.trim()

  if (query.length < 1 || query.length > 500) {
    throw new Error('Query must contain 1–500 characters')
  }

  // Validate retrieval mode
  const mode = data.mode

  if (
    mode !== 'bm25' &&
    mode !== 'dense' &&
    mode !== 'hybrid'
  ) {
    throw new Error('Invalid retrieval mode')
  }

  // Validate top_k
  const top_k = data.top_k

  if (
    typeof top_k !== 'number' ||
    !Number.isInteger(top_k) ||
    top_k < 1 ||
    top_k > 10
  ) {
    throw new Error('top_k must be an integer between 1 and 10')
  }

  return {
    query,
    mode,
    top_k,
  }
}
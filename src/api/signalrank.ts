const apiBaseUrl = import.meta.env.VITE_SIGNALRANK_API_BASE_URL
  ?.trim()
  .replace(/\/+$/, '')

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
    throw new Error(`Health check failed with status ${response.status}`)
  }
}
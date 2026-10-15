import { reserveDailyRetrieval } from '../../gateway/quota'
import { validateRetrieveRequest } from '../../gateway/validation'

interface Env {
  QUOTA_DB: D1Database
  SIGNALRANK_API_URL: string
  SIGNALRANK_SERVICE_TOKEN: string
  TURNSTILE_SECRET_KEY: string
}

const MAX_BODY_BYTES = 8192

function errorResponse(
  status: number,
  message: string,
): Response {
  return Response.json(
    { detail: message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}

export const onRequestPost: PagesFunction<Env> = async ({
  request,
  env,
}) => {
  // 1. Fail closed if security configuration is missing.
  if (
    !env.QUOTA_DB ||
    !env.SIGNALRANK_API_URL ||
    !env.SIGNALRANK_SERVICE_TOKEN ||
    !env.TURNSTILE_SECRET_KEY
  ) {
    return errorResponse(503, 'Gateway unavailable')
  }

  // 2. Require JSON.
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  ) {
    return errorResponse(415, 'JSON required')
  }

  // 3. Reject oversized request bodies.
  let payload: unknown

  try {
    const reader = request.body?.getReader()

    if (!reader) {
      return errorResponse(400, 'Empty request')
    }

    const chunks: Uint8Array[] = []
    let size = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      size += value.byteLength

      if (size > MAX_BODY_BYTES) {
        await reader.cancel()
        return errorResponse(413, 'Request too large')
      }

      chunks.push(value)
    }

    const bytes = new Uint8Array(size)
    let offset = 0

    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }

    payload = JSON.parse(
      new TextDecoder().decode(bytes),
    )
  } catch {
    return errorResponse(400, 'Invalid JSON')
  }

  // 4. Validate retrieval parameters.
  let validated

  try {
    validated = validateRetrieveRequest(payload)
  } catch {
    return errorResponse(400, 'Invalid retrieval request')
  }

  // 5. Require a Turnstile token.
  const data = payload as Record<string, unknown>
  const token = data.turnstile_token

  if (
    typeof token !== 'string' ||
    token.length === 0 ||
    token.length > 2048
  ) {
    return errorResponse(403, 'Human verification required')
  }

  // 6. Verify the token with Cloudflare.
  try {
    const verification = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
        signal: AbortSignal.timeout(5000),
      },
    )

    if (!verification.ok) {
      return errorResponse(503, 'Verification unavailable')
    }

    const result = (await verification.json()) as {
      success?: boolean
      hostname?: string
      action?: string
    }

    if (
      !result.success ||
      result.hostname !== new URL(request.url).hostname ||
      result.action !== 'retrieve'
    ) {
      return errorResponse(403, 'Verification failed')
    }
  } catch {
    return errorResponse(503, 'Verification unavailable')
  }

  // 7. Validate the configured upstream URL.
  let upstreamUrl: URL

  try {
    upstreamUrl = new URL(
      '/retrieve',
      env.SIGNALRANK_API_URL,
    )

    if (upstreamUrl.protocol !== 'https:') {
      return errorResponse(503, 'Gateway unavailable')
    }
  } catch {
    return errorResponse(503, 'Gateway unavailable')
  }

  // 8. Atomically reserve one daily request.
  let allowed: boolean

  try {
    allowed = await reserveDailyRetrieval(env.QUOTA_DB)
  } catch {
    return errorResponse(503, 'Quota service unavailable')
  }

  if (!allowed) {
    return errorResponse(429, 'Daily retrieval limit reached')
  }

  // 9. Forward the authenticated request.
  try {
    const upstream = await fetch(upstreamUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SignalRank-Service-Token':
          env.SIGNALRANK_SERVICE_TOKEN,
      },
      body: JSON.stringify(validated),
      signal: AbortSignal.timeout(12000),
    })

    if (!upstream.ok) {
      return errorResponse(502, 'Retrieval unavailable')
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return errorResponse(502, 'Retrieval unavailable')
  }
}
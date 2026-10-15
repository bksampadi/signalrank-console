import type { D1Database } from '@cloudflare/workers-types'

export const DAILY_RETRIEVAL_LIMIT = 100

export async function reserveDailyRetrieval(
  db: D1Database,
  now: Date = new Date(),
): Promise<boolean> {
  const day = now.toISOString().slice(0, 10)

  const result = await db
    .prepare(
      `
      INSERT INTO daily_retrieval_quota (day, used)
      VALUES (?1, 1)

      ON CONFLICT(day)
      DO UPDATE SET
        used = daily_retrieval_quota.used + 1

      WHERE daily_retrieval_quota.used < ?2

      RETURNING used
      `,
    )
    .bind(day, DAILY_RETRIEVAL_LIMIT)
    .first<{ used: number }>()

  return result !== null
}
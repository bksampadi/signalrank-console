INSERT INTO daily_retrieval_quota (day, used)
VALUES (?1, 1)

ON CONFLICT(day)
DO UPDATE SET
    used = daily_retrieval_quota.used + 1

WHERE daily_retrieval_quota.used < ?2

RETURNING used
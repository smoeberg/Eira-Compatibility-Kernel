# ECK fingerprint — lokal e2e (efter migrate)

BASE=http://localhost:3000
KEY=change-me-in-production
TENANT=550e8400-e29b-41d4-a716-446655440099

# 1. Start run (14 dage)
curl -s -X POST "$BASE/internal/fingerprint/runs" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Key: $KEY" \
  -d "{\"tenantId\":\"$TENANT\"}"

# 2. Ingest (brug runId fra step 1)
RUN_ID=<run-id>
curl -s -X POST "$BASE/internal/fingerprint/ingest" \
  -H "Content-Type: application/json" \
  -H "X-Internal-Api-Key: $KEY" \
  -d "{\"tenantId\":\"$TENANT\",\"runId\":\"$RUN_ID\",\"method\":\"GET\",\"path\":\"/drive/root/children\"}"

# 3. Complete + rapport
curl -s -X POST "$BASE/internal/fingerprint/runs/$RUN_ID/complete" \
  -H "X-Internal-Api-Key: $KEY"

curl -s "$BASE/internal/fingerprint/runs/$RUN_ID/report" \
  -H "X-Internal-Api-Key: $KEY"

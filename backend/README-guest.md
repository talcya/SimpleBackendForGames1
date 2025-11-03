Guest API usage

This short snippet shows how clients should pass a guest session id using the `X-Guest-Id` header and example requests.

1) Create a guest session (server returns a `guestId`):

curl example:

```bash
curl -X POST "https://api.example.com/v1/guests" \
  -H "Content-Type: application/json" \
  -d '{}'
```

PowerShell (Invoke-RestMethod):

```powershell
Invoke-RestMethod -Method Post -Uri "https://api.example.com/v1/guests" -ContentType "application/json" -Body '{}' | ConvertTo-Json
```

Response (example):

{
  "guestId": "2f3b9c1e-...",
  "highScore": 0,
  "inventory": [],
  "lastActive": "2025-11-03T12:00:00Z"
}

2) Submit an event as a guest (include the `X-Guest-Id` header):

curl example:

```bash
curl -X POST "https://api.example.com/v1/events" \
  -H "Content-Type: application/json" \
  -H "X-Guest-Id: 2f3b9c1e-..." \
  -d '{"type":"activity","gameMode":"arcade","data":{"score":100}}'
```

PowerShell example:

```powershell
$body = @{ type = 'activity'; gameMode = 'arcade'; data = @{ score = 100 } } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://api.example.com/v1/events" -Headers @{ 'X-Guest-Id' = '2f3b9c1e-...' } -ContentType "application/json" -Body $body
```

3) When a player signs up and wants to keep their guest progress, include `guestId` in the signup payload (server will migrate events/inventory):

```bash
curl -X POST "https://api.example.com/v1/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Player1","email":"player1@example.com","password":"s3cureP@ssw0rd","guestId":"2f3b9c1e-..."}'
```

Notes:
- The `X-Guest-Id` header is optional and only required for unauthenticated guest activity.
- For authenticated users, prefer sending the Authorization: Bearer <token> header instead.
- The server may expire guest sessions after a configured period (e.g. 30 days). If a guest cannot be found during migration, the signup will proceed but the guest data may not be migrated.

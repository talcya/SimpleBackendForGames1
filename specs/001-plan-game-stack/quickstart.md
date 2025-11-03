# Quickstart Guide: Minimal Cross-Platform Game Backend & Frontend

## Prerequisites
- Node.js 18.x and npm 10+
- MongoDB Atlas project or local MongoDB 6.x instance
- Google OAuth client ID/secret for web applications
- pnpm or npm (examples use npm)

## Repository Setup
```powershell
# Clone repository and install dependencies
npm install --global pnpm
pnpm install
```

## Backend (Express + Socket.IO)

1. **Install packages**
   ```powershell
   cd backend
   pnpm install
   pnpm install express mongoose socket.io cors helmet dotenv bcryptjs jsonwebtoken express-rate-limit passport passport-google-oauth20 node-cron
   pnpm install -D typescript ts-node nodemon jest ts-jest supertest @types/express @types/node @types/jsonwebtoken @types/jest @types/supertest
   ```

2. **Environment configuration** (`backend/.env`)
   ```text
   PORT=3001
   MONGO_URI=mongodb://localhost:27017/gameDB
   JWT_SECRET=change-me-please
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FRONTEND_URL=http://localhost:3000
   DAILY_CHALLENGE_CRON=0 8 * * *
   ```

3. **Run development server**
   ```powershell
   pnpm run dev
   ```
   The backend starts on `http://localhost:3001`. Socket.IO connections share the same host.

4. **Smoke tests**
   ```powershell
   pnpm test
   pnpm test:contract
   ```
   Contract tests align with `specs/001-plan-game-stack/contracts/openapi.yaml`.

## Frontend (Nuxt 4 + Pinia + TailwindCSS)

1. **Install packages**
   ```powershell
   cd ../frontend
   pnpm install
   pnpm install @pinia/nuxt pinia @nuxtjs/tailwindcss axios socket.io-client
   pnpm install -D vitest @vue/test-utils @testing-library/vue playwright @playwright/test
   ```

2. **Environment configuration** (`frontend/.env`)
   ```text
   NUXT_PUBLIC_API_BASE=http://localhost:3001/v1
   NUXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

3. **Run development server**
   ```powershell
   pnpm run dev
   ```
   Visit `http://localhost:3000` for the player experience. `/ops` route gates the live-ops dashboard.

4. **Frontend tests**
   ```powershell
   pnpm run test:unit
   pnpm run test:e2e
   ```

## Integration Checklist
- ✅ Sign up a player via `/auth/signup`, retrieve JWT, and call `/players/me`.
- ✅ Submit an event to `/events` with a `snapshot` payload and confirm analytics metric increment.
- ✅ Create a test group, schedule an offer, and verify notification propagation through Socket.IO.
- ✅ Trigger the daily challenge job via manual endpoint `/challenges/daily` (admin) and confirm announcement.

## Troubleshooting
- Use `pnpm run lint` in both backend and frontend to catch TypeScript or lint errors.
- If MongoDB connection fails, confirm whitelisted IP addresses or swap to local connection string.
- JWT issues often stem from clock drift; sync developer machines or increase token leeway configuration.
- Real-time delivery problems: verify Socket.IO CORS configuration matches `NUXT_PUBLIC_SOCKET_URL`.

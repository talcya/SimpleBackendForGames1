# Data Model: Minimal Cross-Platform Game Backend & Frontend

## Player Account
- **Identifiers**: `_id` (ObjectId), `email` (unique, optional for social-only), `googleId` (nullable), `displayName` (3-32 chars, unique), `avatarUrl`
- **Security**: `passwordHash` (nullable for OAuth-only), `jwtVersion` (increment to invalidate tokens)
- **Progress**: `highScore`, `inventory` (array of item references with acquisition metadata), `friends` (ObjectId refs), `groups` (ObjectId refs)
- **Lifecycle**: `status` (active, suspended, banned), `createdAt`, `updatedAt`, `lastLoginAt`
- **Validation rules**: emails RFC-compliant when present; display names filtered for profanity; password min length 10 characters with hash computed server-side.

## Leaderboard Entry
- **Identifiers**: `_id`, `leaderboardId`, `playerId`
- **Scores**: `score` (non-negative integer), `submittedAt`
- **Context**: `type` (global, local, friends), `region` (ISO country code), `deviceFingerprint` (for local uniqueness)
- **Derived fields**: `rank` (computed at query time), `delta` (trend vs prior submission)
- **Validation rules**: new score must exceed stored high score for same leaderboard scope; deduplicate per player per leaderboard.

## Store Item
- **Identifiers**: `_id`, `sku` (human-readable unique code)
- **Details**: `name`, `category`, `description`, `price` (>=0), `acquisitionMethod` (won, purchased, giveaway)
- **Availability**: `isActive`, `tags`, `bundleItems` (optional nested SKUs)
- **Validation rules**: items referenced by offers must exist and be active during offer window.

## Offer Campaign
- **Identifiers**: `_id`
- **Type**: `kind` (offer, discount, giveaway, daily-challenge)
- **Timing**: `startAt`, `endAt`, `timeZone`
- **Targeting**: `audience` (all, group, playerIds, friendGraph), `groupId`
- **Reward**: `itemId` or `currencyAmount`, `redemptionLimit` (per player), `conditions` (threshold metrics)
- **State transitions**: draft → scheduled → active → expired → archived
- **Validation rules**: `startAt < endAt`; `redemptionLimit` defaults to 1 for giveaways; archived offers immutable.

## Player Group
- **Identifiers**: `_id`, `slug`
- **Metadata**: `name`, `description`, `purpose`, `createdBy`
- **Membership**: `memberIds` (array of player ObjectIds), `autoAssignmentRule` (optional expression)
- **Validation rules**: groups used for offers/notifications must exist before scheduling; track membership count for targeting metrics.

## Notification Message
- **Identifiers**: `_id`
- **Content**: `title`, `body`, `ctaUrl`, `payload`
- **Targeting**: `audienceType` (all, group, friends, player), `audienceRef` (nullable), `channels` (in-app, email placeholder)
- **Delivery**: `sentAt`, `deliveredAt`, `readAt`, `retries`
- **Validation rules**: notifications may not exceed content quota (title 80 chars, body 280 chars); `audienceRef` required unless audienceType = all.

## Event Log
- **Identifiers**: `_id`
- **Linkage**: `playerId`, `sessionId`, `gameMode`
- **Payload**: `type` (snapshot, activity, event), `data` (schema-less object), `ingestedAt`
- **Derived**: `ruleEvaluations` (list of rule outcomes), `source` (http, socket)
- **Validation rules**: ensure payload size limit (<16KB) to prevent abuse; idempotency token per event to avoid duplicates.

## Rule Definition
- **Identifiers**: `_id`, `gameMode`
- **Checks**: array of `{ actionName, minAllowed, maxAllowed, thresholdMultiplier }`
- **Responses**: `violationType`, `severity`, `cooldownAction`
- **State transitions**: draft → active → retired; only one active rule set per game mode.

## Violation Record
- **Identifiers**: `_id`
- **Context**: `playerId`, `violationType` (bad-language, cheat, abuse), `ruleId`, `eventId`
- **Metrics**: `count`, `lastTriggeredAt`, `status` (open, acknowledged, escalated, resolved)
- **Validation rules**: each new violation increments count and updates status; escalated requires moderator reference.

## Analytics Metric
- **Identifiers**: `_id`
- **Dimensions**: `metric` (string), `period` (daily, weekly, monthly), `date` (start of bucket), `segment` (optional audience tag)
- **Values**: `value` (numeric), `sampleCount`, `details` (aggregation notes)
- **Validation rules**: one document per metric/period/date/segment combo; background job compacts old data.

## Daily Challenge
- **Identifiers**: `_id`, `issuedForDate`
- **Content**: `description`, `reward`, `thresholdMetric`, `thresholdValue`
- **Targeting**: `audience` (all, group, friends-of-top-players)
- **Lifecycle**: generated → active → expired; ensures single active challenge per day.
- **Validation rules**: challenge pulled from analytics only if sampleCount >= minimum (default 100 events).

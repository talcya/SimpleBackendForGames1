Testing helpers and events
==========================

This short note documents a test-oriented event emitted by the application to make certain integration tests deterministic.

Event: `guest:migrated`
-----------------------

When a guest session is migrated into a newly created user account (during signup with a `guestId`), the server emits a Node.js process event named `guest:migrated`.

Payload (object) — fields provided:
- `userId` (string): the newly created user id (ObjectId as string).
- `guestId` (string | undefined): the guest session id that was migrated.
- `migratedInventoryCount` (number): how many item ids were moved from the guest inventory into the user.
- `migratedInventoryIds` (string[]): string ids of migrated inventory items (may be empty).

Usage (tests)
-------------

Tests can attach a one-time listener before calling the signup endpoint and wait for the event to know the migration completed. Example:

```ts
const migrationPromise = new Promise((resolve) => {
  const timeout = setTimeout(() => resolve(null), 5000);
  (process as any).once('guest:migrated', (payload: any) => { clearTimeout(timeout); resolve(payload); });
});

// call signup with guestId then await migrationPromise
```

Notes
-----
- This event is intended for test determinism only; it's safe to call even if no listeners are present.
- The `migratedInventoryIds` array is provided to help assertions but may be large if a guest had many items — tests should avoid relying on huge payloads.

If you'd like this signalled differently (e.g., via a test-only HTTP webhook), say the word and I can add that alternative.

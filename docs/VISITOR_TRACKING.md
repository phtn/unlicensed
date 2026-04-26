# Visitor Tracking

Last updated: 2026-04-26

This document describes the current visitor tracking implementation and the information we expect from `app/_components/device-info.tsx`, `app/_components/guest-behavior-tracker.tsx`, `lib/guest-tracking.ts`, and `/api/guest-tracking`.

## Summary

Visitor tracking uses a client-generated guest visitor ID as the primary visitor key. That ID is stored in `localStorage` and a cookie, then sent with page view and identify events to `/api/guest-tracking`. The API validates the payload, derives server-side signals from request headers, and writes normalized visitor and event records into Convex.

The browser fingerprint is not the primary visitor key. It is collected separately through `fingerprintjs2` and currently sent as event metadata named `browserFingerprintId` when collection succeeds. A second, more browser-independent fingerprint is sent as `deviceFingerprintId`; Convex uses that field first when deciding whether to update an existing visitor or create a new one.

`device-info.tsx` exposes a richer `DeviceProfile` helper, but it is not currently mounted in the automatic guest tracking flow. It should be treated as a utility for future device/profile capture, not as data that is guaranteed to exist in every visitor event.

## Runtime Flow

1. `app/_components/deferred-root-client.tsx` dynamically mounts `GuestBehaviorTracker` on the client after idle time. Server-side rendering is disabled for this tracker.

2. `GuestBehaviorTracker` skips tracking if the visitor opted out, `navigator.doNotTrack === '1'`, or Global Privacy Control is enabled.

3. `GuestBehaviorTracker` skips these path prefixes for anonymous page-view tracking: `/admin`, `/account`, `/api`, `/auth`, and `/studio`.

4. `getOrCreateGuestVisitorId()` reads `rapidfire:guestVisitorId` from `localStorage` or `rapidfire_guest_visitor_id` from cookies. If neither exists, it creates a new ID prefixed with `gv_`.

5. The visitor ID is stored in both `localStorage` and a 180-day `SameSite=Lax` cookie. The cookie is marked `Secure` on HTTPS.

6. Page views are sent once per `fullPath` per tracker instance. The payload is queued with `requestIdleCallback` when available.

7. Events are sent to `/api/guest-tracking` with `navigator.sendBeacon()` first. If Beacon is unavailable or fails, the tracker falls back to `fetch()` with `keepalive: true`.

8. When a Firebase-authenticated user exists, the tracker sends an `identify` event only if a guest visitor ID already exists. It does not create a new guest visitor ID just for identify.

9. `/api/guest-tracking` validates the payload with Zod, enriches it with request-derived fields, and calls `api.guestTracking.m.recordEvent`.

10. `recordEvent` looks up an existing visitor by `deviceFingerprintId` first, then falls back to `visitorId`. It upserts a `guestVisitors` summary row and inserts a `guestVisitorEvents` row unless the event is a duplicate page view within the dedupe window.

## Guest Visitor ID

The guest visitor ID is the durable client-side identifier used to connect events from the same browser.

| Item | Value |
| --- | --- |
| Cookie name | `rapidfire_guest_visitor_id` |
| Local storage key | `rapidfire:guestVisitorId` |
| Format | `gv_${randomId}` |
| Max age | 180 days |
| Validation | 12 to 128 trimmed characters |
| Source file | `lib/guest-tracking.ts` |

The ID is generated with `crypto.randomUUID()` when available. If not available, it falls back to a timestamp plus `Math.random()`.

## Browser Fingerprint

`lib/fingerprintjs2/index.ts` wraps `fingerprintjs2` with a browser-only dynamic import.

Expected output from `getFingerprint()`:

| Field | Type | Meaning |
| --- | --- | --- |
| `visitorId` | `string` | A `fingerprintjs2` MurmurHash-derived hash of collected component values. |
| `components` | `Fingerprint2.Component[]` | The raw fingerprint components available to local callers. |

Expected output from `getFingerprintId()`:

| Field | Type | Meaning |
| --- | --- | --- |
| return value | `string` | The `visitorId` only. This is what `GuestBehaviorTracker` sends. |

Expected output from `getDeviceFingerprintId()`:

| Field | Type | Meaning |
| --- | --- | --- |
| return value | `string` | A device-level fingerprint hash used as `deviceFingerprintId`. This is less browser-specific than the default fingerprint and is used for cross-browser visitor matching. |

The default fingerprint excludes these components: `adBlock`, `audio`, `doNotTrack`, `enumerateDevices`, `fontsFlash`, and `pixelRatio`.

The device fingerprint also excludes `addBehavior`, `fonts`, `indexedDb`, `language`, `localStorage`, `openDatabase`, `plugins`, `sessionStorage`, and `userAgent` so the same physical device has a better chance of resolving to the same visitor across different browsers.

The tracker sends only hashes: `deviceFingerprintId` at the top level and `metadata.browserFingerprintId` in metadata. It does not send the raw fingerprint component list to `/api/guest-tracking`.

If fingerprint collection fails, the event is still sent without `browserFingerprintId`.

## Device Profile Helper

`app/_components/device-info.tsx` exports `getDeviceProfile(ref)`. It must run in a browser because it reads `window`, `navigator`, screen APIs, canvas APIs, and fingerprint APIs.

Expected `DeviceProfile` output:

| Field | Type | Source | Notes |
| --- | --- | --- | --- |
| `userAgent` | `string` | `navigator.userAgent` | Raw browser user-agent string. |
| `cores` | `number \| null` | `navigator.hardwareConcurrency` | Current implementation reads the browser value directly. |
| `screen.width` | `number` | `window.screen.width` | Physical screen width in CSS pixels. |
| `screen.height` | `number` | `window.screen.height` | Physical screen height in CSS pixels. |
| `screen.pixelRatio` | `number` | `window.devicePixelRatio \|\| 1` | Browser/device pixel ratio. |
| `hasTouch` | `boolean` | `ontouchstart` or `navigator.maxTouchPoints` | Basic touch-capability signal. |
| `timezone` | `string` | `Intl.DateTimeFormat().resolvedOptions().timeZone` | IANA timezone when available. |
| `canvasFingerprint` | `string` | `canvas.toDataURL()` | Returns `not-supported` if no canvas ref exists or collection fails. |
| `fingerprintId` | `string` | `getFingerprint().visitorId` | Same fingerprint hash source as `browserFingerprintId`. |
| `deviceFingerprintId` | `string` | `getDeviceFingerprint().visitorId` | Same fingerprint hash source as top-level `deviceFingerprintId`. |
| `webglVendor` | optional union | Not populated today | The type allows it, but `getDeviceProfile()` does not currently return it. |

Important implementation note: `DeviceProfile` is currently a helper only. No automatic visitor tracking code calls `getDeviceProfile(ref)` today, so these fields should not be assumed to exist in Convex visitor records.

## Guest Tracking Client Payload

`GuestBehaviorTracker` currently sends two event types: `page_view` and `identify`.

Expected `page_view` payload fields:

| Field | Source | Required by client today | Notes |
| --- | --- | --- | --- |
| `visitorId` | `getOrCreateGuestVisitorId()` | Yes | Browser-scoped fallback visitor key. |
| `deviceFingerprintId` | `getDeviceFingerprintId()` | Optional | Preferred Convex lookup key for cross-browser device matching. |
| `type` | Literal `page_view` | Yes | API also accepts more event types for future use. |
| `path` | `window.location.pathname || '/'` | Yes | Validated to 1 to 500 chars. |
| `fullPath` | `pathname + search` | Yes | Validated to max 1000 chars. |
| `title` | `document.title` | Yes | Validated to max 200 chars. |
| `referrer` | Previous tracked URL or `document.referrer` | Optional | Included only when available. |
| `utmSource` | `utm_source` search param | Optional | Max 200 chars. |
| `utmMedium` | `utm_medium` search param | Optional | Max 200 chars. |
| `utmCampaign` | `utm_campaign` search param | Optional | Max 200 chars. |
| `utmTerm` | `utm_term` search param | Optional | Max 200 chars. |
| `utmContent` | `utm_content` search param | Optional | Max 200 chars. |
| `deviceType` | User-agent regex on client | Yes | `desktop`, `mobile`, `tablet`, or `unknown`. |
| `screenWidth` | `window.innerWidth` | Yes | Viewport width, not physical screen width. |
| `screenHeight` | `window.innerHeight` | Yes | Viewport height, not physical screen height. |
| `timezone` | `Intl.DateTimeFormat().resolvedOptions().timeZone` | Yes | Max 120 chars. |
| `locale` | `window.navigator.language` | Yes | Max 80 chars. |
| `consent` | Literal `unknown` | Yes | If `denied`, the API drops the event with HTTP 204. |
| `metadata.returningVisitor` | Existing visitor ID presence | Yes | Boolean. |
| `metadata.browserFingerprintId` | `getFingerprintId()` | Optional | Added only when fingerprint collection succeeds. |

Expected `identify` payload fields:

| Field | Source | Required by client today | Notes |
| --- | --- | --- | --- |
| `visitorId` | Existing guest visitor ID | Yes | Identify is skipped if no guest visitor ID exists. |
| `deviceFingerprintId` | `getDeviceFingerprintId()` | Optional | Preferred Convex lookup key for cross-browser device matching. |
| `type` | Literal `identify` | Yes | Used to connect a guest visitor to an authenticated session. |
| `path` | `window.location.pathname || '/'` | Yes | Current page path. |
| `fullPath` | `pathname + search` | Yes | Current URL path and query. |
| `title` | `document.title` | Yes | Current document title. |
| `consent` | Literal `unknown` | Yes | Same API behavior as page views. |
| `metadata.browserFingerprintId` | `getFingerprintId()` | Optional | Added only when fingerprint collection succeeds. |

## API Enrichment

`app/api/guest-tracking/route.ts` accepts the client payload, validates it, and derives additional fields from request headers and cookies.

Server-derived fields:

| Field | Source | Notes |
| --- | --- | --- |
| `deviceType` | Payload first, otherwise server user-agent parser | Payload wins when present. |
| `deviceFingerprintId` | Payload | Used to find an existing `guestVisitors` row before falling back to `visitorId`. |
| `browser` | Request `user-agent` | Simple regex parser: Edge, Opera, Chrome, Firefox, Safari. |
| `os` | Request `user-agent` | Simple regex parser: Windows, iOS, Android, macOS, Linux. |
| `country` | `x-vercel-ip-country` or `cf-ipcountry` | Header value is URI-decoded if possible. |
| `region` | `x-vercel-ip-country-region` | Header value is URI-decoded if possible. |
| `city` | `x-vercel-ip-city` | Header value is URI-decoded if possible. |
| `linkedUserFid` | Firebase session cookie | Uses `verifyFirebaseSessionCookie()`. |
| `ipNetworkHash` | Client IP network plus `GUEST_TRACKING_HASH_SALT` | Omitted if salt or IP is missing. |
| `userAgentHash` | Request `user-agent` plus `GUEST_TRACKING_HASH_SALT` | Omitted if salt or user agent is missing. |
| `clientHintsHash` | `sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform` plus salt | Omitted if salt or hints are missing. |

The guest tracking API does not store raw IP addresses or raw user-agent strings in `guestVisitors` or `guestVisitorEvents`. It stores hashes only when `GUEST_TRACKING_HASH_SALT` is configured.

Metadata is sanitized before storage:

| Rule | Behavior |
| --- | --- |
| Max keys | 25 entries |
| Key length | 80 chars |
| Key characters | Non `A-Za-z0-9.:-` characters become `-` |
| Blocked keys | Empty keys, `$`-prefixed keys, and `_`-prefixed keys are dropped |
| String value length | 500 chars |
| Allowed value types | `string`, `number`, `boolean`, `null` |

## Convex Storage

`convex/guestTracking/m.ts` writes two tables.

`guestVisitors` is the summary table keyed by `visitorId`.

Expected summary fields:

| Field group | Fields |
| --- | --- |
| Identity | `visitorId`, `deviceFingerprintId`, `linkedUserFid`, `linkedAt` |
| Timing | `firstSeenAt`, `lastSeenAt`, `createdAt`, `updatedAt` |
| Counts | `pageViewCount`, `eventCount` |
| Paths | `firstPath`, `lastPath`, `landingUrl`, `lastUrl` |
| Attribution | `firstReferrer`, `lastReferrer`, `utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent` |
| Device | `deviceType`, `browser`, `browsers`, `os`, `screenWidth`, `screenHeight`, `timezone`, `locale` |
| Location | `country`, `region`, `city` |
| Hashed signals | `ipNetworkHash`, `userAgentHash`, `clientHintsHash` |
| Consent | `consent` |

`guestVisitorEvents` is the append-only event table.

Expected event fields:

| Field group | Fields |
| --- | --- |
| Identity | `visitorId`, `deviceFingerprintId`, `linkedUserFid` |
| Event | `type`, `path`, `fullPath`, `title`, `createdAt` |
| Attribution | `referrer`, `utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent` |
| Device | `deviceType`, `browser`, `os`, `screenWidth`, `screenHeight`, `timezone`, `locale` |
| Location | `country`, `region`, `city` |
| Hashed signals | `ipNetworkHash`, `userAgentHash`, `clientHintsHash` |
| Consent and metadata | `consent`, `metadata` |

Duplicate page views are suppressed when the latest event for the resolved visitor is also a `page_view` for the same `path` within 2500 ms.

When a new browser on the same device sends the same `deviceFingerprintId`, `recordEvent` updates the existing visitor instead of creating a new one. The latest browser stays in `browser`, and every distinct browser label is retained in the deduped `browsers` array.

## Guest Chat Room Creation

Guest chat room creation is gated by visitor tracking.

`ctx/guest-chat.tsx` calls `trackGuestPageView({awaitPersistence: true})` before calling `api.messages.m.ensureGuestConversation`. Unlike normal page-view tracking, this path uses `fetch` and waits for `/api/guest-tracking` to return successfully, so the `guestVisitors` row exists in Convex before chat setup starts.

`api.messages.m.ensureGuestConversation` requires a `visitorId` and accepts an optional `deviceFingerprintId`. The mutation looks up the saved visitor by `deviceFingerprintId` first, then by `visitorId`. If no saved visitor exists, it throws and does not create the guest chat participant or representative follow link.

When the chat guest is created or updated, the `guests` row stores `visitorId` and `deviceFingerprintId` so the chat participant can be traced back to the tracked visitor record.

The initial guest display name is generated from the tracked visitor as `Guest {country} {os}` when those signals are available. For example, a visitor with `country: "PH"` and `os: "macOS"` becomes `Guest PH macOS`. If OS is unavailable, the device type is used as a fallback. If neither signal is available, the name remains `Guest`. Later real contact names from checkout/profile flows can replace the placeholder and are not overwritten by future tracking updates.

## API Accepted Event Types

The API and Convex schema support these event types:

| Event type | Current automatic source |
| --- | --- |
| `page_view` | `GuestBehaviorTracker` |
| `identify` | `GuestBehaviorTracker` when a Firebase user is present and a guest ID exists |
| `cart_action` | Accepted by API, not emitted by `GuestBehaviorTracker` today |
| `checkout_step` | Accepted by API, not emitted by `GuestBehaviorTracker` today |
| `search` | Accepted by API, not emitted by `GuestBehaviorTracker` today |
| `custom` | Accepted by API, not emitted by `GuestBehaviorTracker` today |

## Admin Queries

`convex/guestTracking/q.ts` exposes admin-only queries:

| Query | Purpose |
| --- | --- |
| `getRecentVisitors` | Recent `guestVisitors` sorted by `lastSeenAt`. |
| `getRecentEvents` | Recent `guestVisitorEvents`, optionally filtered by event type or visitor ID. |
| `getVisitorStats` | Aggregates recent event counts, unique visitors, identified visitors, page views by path, visits by device, and visits by country. |

These queries require admin access through Convex auth and staff-role checks.

## Separate Middleware Page Logs

There is also middleware-level request logging in `proxy.ts` that targets the `logs` table through `api.logs.m.createLog`. This is separate from guest visitor tracking.

Intended middleware log fields include method, path, full URL, query params, session ID, raw IP address, raw user agent, referrer, origin, parsed device/browser/OS, screen dimensions from cookies, country/city, status code, response time, and `createdAt`.

Current caveat: `proxy.ts` contains a `return false` immediately after `api.admin.q.getIpapiGeolocationEnabled` succeeds. As written, that likely exits `logVisit()` before the middleware creates the `page_visit` log. This does not affect `/api/guest-tracking`, but it does mean the separate `logs` table may not receive middleware page-visit logs when that settings query succeeds.

## Privacy and Reliability Notes

Tracking is best-effort. If fingerprinting fails, the page view or identify event still sends without fingerprint fields and falls back to the browser-scoped guest visitor ID.

Guest tracking honors opt-out storage, Do Not Track, and Global Privacy Control before sending client events.

The client currently sends `consent: 'unknown'`. If a future caller sends `consent: 'denied'`, `/api/guest-tracking` returns `204` and does not write to Convex.

`guestVisitors` and `guestVisitorEvents` store hashed IP network, hashed user agent, and hashed client hints only when `GUEST_TRACKING_HASH_SALT` is configured.

The richer `DeviceProfile` helper can expose a raw user agent and canvas data URL to local callers. Those fields are not automatically sent to `/api/guest-tracking` today.

Cross-browser device matching is approximate. Browsers intentionally isolate storage and can report different fingerprint signals, so `deviceFingerprintId` should reduce duplicate visitors across browsers but cannot guarantee perfect one-device-one-row identity.

# Feature coverage vs. `winkpop.pdf`

This maps every section of the product spec (the "Ability to…" lists, §0–§24, plus the
BARTER group-order notes) to what the app does today.

- ✅ **Built**: works end to end against the local data layer.
- 🟡 **Simulated**: the whole UI flow works, but one step is faked because it needs a device
  module or third-party service the project doesn't include yet (camera, OAuth, payments,
  carriers). The comment at that spot in the code points to the swap-in point.
- ⏳ **Not built**: needs a backend or is explicitly V2 in the spec.

Everything runs against the typed mock layer in `src/data/` (persisted to AsyncStorage).
When a real backend (e.g. Supabase) is plugged in, the screens don't need to change.

| § | Area | Status | Notes / where |
|---|------|--------|---------------|
| 0 | Standardized card naming | ✅ | `catalog.ts → standardName`; every listing resolves to a database card |
| 1A–I, M–O, T–Y | Signup, login, profile, groups, prefs, address, payment, validation, progress bar, stay logged in | ✅ | `(auth)/login.tsx`, `(auth)/onboarding.tsx` (5 steps), `forgot.tsx` |
| 1J, P, R, S | Instagram / Google login, mutuals | 🟡 | `(auth)/instagram.tsx` has the permissions, progress and mutuals screens. The OAuth exchange itself is mocked |
| 1K–L | New-collector tutorial, glossary, supplies bundle | ✅ | onboarding step 5, `tutorial.tsx` |
| 2 | Discover · Transactions · + · Messages · Profile, back arrows | ✅ | `(tabs)/_layout.tsx`, shared `Page` header |
| 3A–F, P–X | Database: group→member→era, album/POB/MD trees, entry page, marks, wishlist, recent sales, sellers, "List this card", picker | ✅ | `database.tsx`, `catalog/[id].tsx`, `CatalogPicker` |
| 3G | Visual-attribute search | ✅ | hair / outfit / background / props / lighting in `searchCatalog` |
| 3H–K | Template-built decks, add group/template (points), in-app templates | ✅ / 🟡 | submissions earn points. Template images are placeholders |
| 3L–N | Scan to identify / value / submit | 🟡 | capture is simulated. Identification matches a typed hint against the database |
| 3O | Watermark-free subscription | ✅ | "WinKPop Plus" toggle (no billing) |
| 4A–D, F–K, M, P–GG | Search, filters, sort, counts, saved searches, new releases, old eras, recommendations, similar, recently viewed, groups directory, group pages | ✅ | `(tabs)/browse.tsx`, `group/[id].tsx`, `home.tsx`, `commerce.ts → recommend/similarListings` |
| 4E | Discord button | ✅ | `DISCORD_URL` is a placeholder invite and needs the real link |
| 4L | Follow a group for listing alerts | ✅ | group page + notification settings |
| 4N | Fair-visibility algorithm | 🟡 | recommendation scoring is client-side. A real ranking service is a backend task |
| 4O | Domestic / global feed | ✅ | Discover scope chips |
| 5 | Upload sheet | ✅ | |
| 6A–DD, II–VV | Listing create / edit / delete, database tagging, title auto-fill, hashtags, condition + damaged, sale/trade/both, $0.05 steps, ≥$1, suggested/last-sold, smart pricing, zero fees + earnings, shipping prompt, trade prefs (wishlist/specific/lock/ratio), bundles, hold, promote, activate/deactivate, bulk edit, one-tap list duplicate, per-slide price/caption, numbered multi-card bulk listing | ✅ | `listing/new.tsx`, Selling tab |
| 6A, N | Camera / gallery, crop | 🟡 | photos are generated placeholders until `expo-image-picker` is added |
| 6Q | Condition checking | 🟡 | condition + damaged flag. No automated grading |
| 7A–K, N–AA | Likes, saves, cart (select / delete / +Add / 30-day expiry), bundle discounts, offers & counters, seller info, Buy Now, WTS/WTT tap, tag reveal, message seller, actions menu, purchase confirmation, Sales hub | ✅ | `card/[id].tsx`, `cart.tsx`, `buy/[id].tsx`, `likes.tsx`, `saves.tsx`, `hub.tsx` |
| 7L–M | Live selling, non-PC merch | ⏳ | V2 per spec |
| 8A–B, D, G–H | Low/avg/high, history, group price guide, collection value trend, expandable chart + sales by country | ✅ | |
| 8F | Pull prices from Pocamarket / Neokyo / Mercari / Vinted | ⏳ | sources are listed. Scraping/ingestion is a backend job |
| 9A–T, W–Z | Trading tabs, incoming/outgoing counts, accept/decline, filters, ratios + top-up, label + fee, authentication > $50, mark complete → collection & wishlist update, donation subscription, start a trade from a listing | ✅ | Trading tab, `trade/new.tsx` |
| 9V | Cross-group / nugu trading | ⏳ | V2 per spec |
| 11 | Collection: totals, value, by group, all, haves/wants/dupes, segments, cost by group/member (hideable), add via picker or whole album, list duplicate | ✅ | `collection.tsx` |
| 11E | Add via template photo / Instagram AI match | 🟡 | routes to the scan flow |
| 12 | Wishlists: 3-step create, priority + levels, WTB/WTT/ISO, folders, templates, edit, who-has, alerts, profile display, ≤40-char names, text entries | ✅ | `wishlists/*` |
| 13 | Posts: 10 media, reorder, text/audio, links (validated), types, group/member tags, account tags, location, 500-char caption, comments/likes toggles, archive, edit, collab, collection account, cancel upload | ✅ | `post/new.tsx`, `post/[id].tsx` |
| 13H, J, T | Real camera/crop, Instagram cross-post | 🟡 | |
| 14 | Stories (24h, multi, music/text/filters/collage flags, close friends, hide from, viewers, like/reply/send, delete/archive), highlights (heart-shaped, unlimited, edit/re-cover/delete), viewer with auto-advance + tap zones | ✅ | `story/*`, `highlights.tsx` |
| 14B–C, H | Drawing, video trim/mute, save to camera roll | 🟡 | stored as flags. Save uses the system share sheet |
| 15A–V, X–Y | Follow/request/private, mutuals, likes/saves/comments/replies/pins, reposts, share to DM, saved folders, following feed, community sub-tabs + hashtags, comeback spaces, local collectors, listing comments | ✅ | `community.tsx`, `user/[username].tsx`, `follows/*`, `saved-folders.tsx` |
| 15W | Live streams | ⏳ | V2 per spec |
| 16 | Messages: filters + Pending/Completed, folders, search, online/unread, compose DM/group, text/voice/photo/video/listing, double-tap like, reply, read receipts, timestamps, pin/mute/unread/flag/delete, group rename/members/leave, requests, offers in DMs | ✅ | `(tabs)/messages.tsx`, `chat/*` |
| 16A | Switch accounts | 🟡 | switching means logging into another account |
| 16G | Voice/photo/video capture | 🟡 | sends placeholder media |
| 17 | Notifications hub + preferences | ✅ | in-app. Push delivery needs a backend + Expo push |
| 18 | Tracking hub, summaries, search, filters, status, tracking steps, label, offers/purchases, selling stats | ✅ | `tracking/*`, Transactions tab |
| 18I | Live carrier updates | 🟡 | "Refresh tracking" simulates a carrier scan |
| 19 | Four shipping options, free shipping, label calculator, stamped-video proof, customs, packing guide | ✅ | `settings/shipping.tsx`, `tracking/[id].tsx` |
| 19E | Buy labels in-app | 🟡 | charged to wallet. No carrier API |
| 20 | Payment methods, held payments, wallet, payouts history, transfer, coupons, points (earn via database uploads, redeem), premium, 5% service fee summary, wallet at checkout, spending limit | ✅ | `settings/payments.tsx`, cart / buy now |
| 20A–B, L | Real card / Apple Pay / PayPal processing, escrow | 🟡 | choice is recorded. Processing needs a payments provider |
| 21 | Ratings, reviews with tags, breakdown + filters, badges (since / fast shipper / responder / reliable / proof tiers / Verified at 100) | ✅ | `reviews/*`, `review/[orderId].tsx`, `community.ts` |
| 21E | Auto 5-star after sale | 🟡 | explained in UI. Needs a scheduled backend job |
| 22 | Fake-card DB, reports (listing/user/post/message), block, three strikes, non-delivery / fake-card policies, proof cross-referencing | ✅ / 🟡 | `safety.tsx`, `ReportSheet`. Cross-platform verification is recorded, not checked |
| 23 | Profile: icons, photo + story options, badges, location/shipping/intl, rating → reviews, followers, bio with @tags, About/Rules, links + socials, banner, availability, collecting (full/members/none, priority), shortcuts, Posts/Listings/All with filters/sort/search, + tile, other users' profiles | ✅ | `(tabs)/profile.tsx`, `edit-profile.tsx`, `user/[username].tsx` |
| 24 | Edit collecting list | ✅ | `edit-collecting.tsx` |
| BARTER | Group orders: claim before paying, threshold confirm, GOM sign-up | ✅ | `group-orders.tsx` |
| — | Dark mode | 🟡 | setting + status bar/background. A full dark palette is follow-up work |

## App icon

`assets/images/icon.png` (iOS/default), `adaptive-icon.png` (Android, inside the 66% safe zone),
`favicon.png` (web) and `splash-icon.png` are generated from the provided winkpop wordmark
and wired up in `app.json`.

# VedGuide site routes

Base URL: set `NEXT_PUBLIC_SITE_URL` (production: `https://vedguide.com`).  
Local dev: `http://localhost:3000`

Machine-readable sitemap: `/sitemap.xml` (public marketing pages only).

---

## Public (in sitemap)

| Path | Notes |
|------|--------|
| `/` | Home |
| `/free-kundli` | Free kundli funnel |
| `/free-kundli/result` | Result page |
| `/free-kundli/result/b` | Result variant B |
| `/astro-path/free-kundli` | Astro path funnel |
| `/astro-path/free-kundli/result` | Astro path result |
| `/checkout/kundli` | Paid kundli checkout |
| `/checkout/consultation` | Consultation checkout |
| `/astro-path/checkout/kundli` | Astro path checkout |
| `/consultation` | Consultation landing |
| `/kundli-report` | Report info |
| `/premium-kundli-review` | Review form |
| `/tools` | Tools hub |
| `/tools/kundal-dhatu` | Kundal dhatu tool |
| `/tools/muhurat` | Muhurat |
| `/tools/numerology` | Numerology |
| `/tools/name-letter/a` | Name letter (example) |
| `/tools/name-letter/a/free-kundli` | Letter funnel |
| `/astro-path/tools/kundal-dhatu` | Astro path tool |
| `/about` | About |
| `/faq` | FAQ |
| `/support` | Support |
| `/login` | User login |
| `/signup` | User signup |
| `/astrologers` | Astrologer directory |
| `/free-services` | Free services |
| `/pooja` | Pooja |
| `/remedy` | Remedy |
| `/gift-card` | Gift card |
| `/following` | Following |
| `/assistant` | Assistant |

---

## Auth & account

| Path | Notes |
|------|--------|
| `/auth/callback` | Supabase auth callback |
| `/user` | Account home (login required) |
| `/users/settings` | User settings |
| `/profile` | Profile |
| `/orders` | Order history |

---

## Thank you (post-payment)

| Path |
|------|
| `/thank-you/kundli` |
| `/thank-you/consultation` |

---

## Astrologers (customer)

| Path |
|------|
| `/astrologers` |
| `/astrologers/[slug]` |
| `/astrologers/chats` |
| `/astrologers/chats/[sessionId]` |
| `/astrologers/chats/waiting/[sessionId]` |
| `/astrologers/wallet` |

---

## Commerce admin (staff)

Configured via `NEXT_PUBLIC_ADMIN_PANEL_PATH` (default: `vg-console-8f3k2p`).

**Login:** `/{ADMIN_PANEL_PATH}/login`  
Example: `http://localhost:3000/vg-console-8f3k2p/login`

Legacy URLs `/admin` and `/admindeoghar` redirect to home (not admin).

| Path (after base) |
|-------------------|
| `/` (dashboard) |
| `/orders`, `/orders/[id]` |
| `/leads`, `/leads/[id]` |
| `/payments` |
| `/products` |
| `/coupons` |
| `/consultations` |
| `/reviews` |
| `/support` |
| `/integrations` |
| `/automations` |
| `/settings` |
| `/analytics`, `/analytics/funnels`, `/analytics/funnels/kfp` |
| `/content`, `/content/pages`, `/content/faqs`, `/content/testimonials`, `/content/banners` |
| `/post-upsell` |
| `/team` |
| `/tools` |
| `/logs` |

---

## Live astrology ops (staff)

Configured via `NEXT_PUBLIC_ASTRO_OPS_PATH` (default: `vg-astral-9m4q1x`).

Example: `http://localhost:3000/vg-astral-9m4q1x`

Legacy `/astro-ops` redirects to the configured path.

| Path (after base) |
|-------------------|
| `/` (dashboard) |
| `/inbox` |
| `/sessions`, `/sessions/[sessionId]` |
| `/users`, `/users/[userId]` |
| `/astrologers` |
| `/wallet-ledger` |
| `/settings` |

---

## API (not browsable)

| Method | Path |
|--------|------|
| POST | `/api/payments/create-order` |
| POST | `/api/payments/create-consultation-order` |
| POST | `/api/payments/verify` |
| POST | `/api/payments/failure` |
| POST | `/api/coupons/validate` |
| POST | `/api/checkout/view` |
| POST | `/api/kundli/submit` |
| POST | `/api/leads/capture` |
| POST | `/api/events/track` |
| POST | `/api/support` |
| POST | `/api/reviews/premium-kundli` |
| POST | `/api/auth/phone-otp/send` |
| POST | `/api/auth/phone-otp/verify` |
| GET/POST | `/api/user/chat-sessions` |
| POST | `/api/user/chat-sessions/[sessionId]/close` |
| POST | `/api/user/chat-sessions/[sessionId]/meter` |
| POST | `/api/user/wallet/create-recharge-order` |
| POST | `/api/user/wallet/verify-recharge` |
| GET | `/api/user/wallet/topup-info` |
| POST | `/api/admin/orders/[orderId]/kundli-report-upload` |
| POST | `/api/admin/live-consult/chat` |
| POST | `/api/admin/live-consult/session/start` |
| POST | `/api/cron/scheduled-kundli-deliveries` |

---

## System

| Path |
|------|
| `/robots.txt` |
| `/sitemap.xml` |

---

## Security notes

1. Set **unique** `NEXT_PUBLIC_ADMIN_PANEL_PATH` and `NEXT_PUBLIC_ASTRO_OPS_PATH` in production (20+ random alphanumeric characters).
2. Do not link admin URLs from the public site or sitemap.
3. Admin access still requires Supabase login + `ADMIN_EMAIL_ALLOWLIST` or `vedguide_admin` metadata.
4. Rotate paths if an old URL is leaked.

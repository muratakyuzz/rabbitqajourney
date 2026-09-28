
# Partner Dashboard Redesign

Replace `src/pages/partner/Dashboard.tsx` with a premium, clean layout adapted from the partner's type, tier, and rebate period. Use neutral palette + purposeful accent colors (green/amber/red/blue/purple) wired through semantic tokens in `src/index.css` and `tailwind.config.ts`.

## Sections

### 1. KPI bar (4 cards, single row)
- **Active Leads** — count + "+N this week"
- **Active Deals** — count + total pipeline value
- **Est. Commission (current rebate period)** — amount + "Q2 2026 · 15%"
- **Marketing Support** — budget for tier (hidden for tiers without it)

Flat cards, muted uppercase label, large number, small secondary line.

### 2. Three-column main grid (`lg:grid-cols-3`)

**Column 1 — Tier + Action required**
- `TierStatusCard`: tier badge, clickable progression row (`Silver → Gold · 57%`) with chevron, two info chips (current/next rebate rate). Click opens `TierComparisonDialog` (shadcn Dialog) showing current vs next-tier side-by-side: revenue gap, rebate %, marketing support, cert requirements.
- `ActionRequiredCard`: title + count badge; alert rows with left accent (red/amber/blue) for missing certs, time warnings, opportunities. Nested **Inactive Opportunities** subsection with sleep icon: rows = colored dot (red 14d+, amber 7–13d) + name + stage + value + days-inactive pill.

**Column 2 — Pipeline funnel**
- `PipelineFunnel`: 6 stacked trapezoid SVG rows (Identified→Qualified→Proposal→Negotiation→Won→Lost) with proportional width based on deal count, color per stage (gray/blue/purple/amber/green/red), inline count + value label, dimmed when 0.
- Below: 3 summary chips — Win rate, Active pipeline value, Total won value.

**Column 3 — Commission + Certifications**
- `CommissionCard` (amber top border): period title, rebate+tier subtitle, two chips (Estimated this period / Last paid previous period), Progress bar + % + days remaining.
- `CertificationCard` (red top border when missing required): tier requirement summary, list rows with icon + name + role + status pill (Active green / Missing red / Expiring amber / Not started neutral).

### 3. Bottom row (`lg:grid-cols-2`)
- **Recent Deals**: name, stage badge, value, date
- **Recent Activity**: text + relative time feed

## Data wiring
Use existing APIs (`listLeads`, `listDeals`, `getDashboardSummary`, `listMyPartnerOnboardingTasks`) plus `partner-config-store` for tier/rebate config. Compute derived metrics client-side:
- Funnel buckets by deal stage from `listDeals`
- Inactive opportunities: items where `Date.now() - updatedAt >= 7d`
- Period progress: derive % complete and days remaining from rebate period (Monthly/Quarterly/Yearly) of current date
- Win rate = won / (won + lost)

For values not yet in backend (marketing support budget, certifications list, tier next-step thresholds), introduce a small `partner-dashboard-mock.ts` helper that returns the sample-data shape so the UI renders end-to-end. Easy to swap with real API later.

## Files

**New:**
- `src/components/partner-dashboard/KpiBar.tsx`
- `src/components/partner-dashboard/TierStatusCard.tsx` + `TierComparisonDialog.tsx`
- `src/components/partner-dashboard/ActionRequiredCard.tsx`
- `src/components/partner-dashboard/PipelineFunnel.tsx`
- `src/components/partner-dashboard/CommissionCard.tsx`
- `src/components/partner-dashboard/CertificationCard.tsx`
- `src/components/partner-dashboard/RecentDeals.tsx`
- `src/components/partner-dashboard/RecentActivity.tsx`
- `src/lib/partner-dashboard-data.ts` (selectors + mock fallbacks for cert/marketing/tier thresholds)

**Edited:**
- `src/pages/partner/Dashboard.tsx` — full rewrite composing the above
- `src/index.css` — add semantic tokens: `--stage-identified`, `--stage-qualified`, `--stage-proposal`, `--stage-negotiation`, `--stage-won`, `--stage-lost`, plus `--accent-success/warning/danger/info` if not already present
- `tailwind.config.ts` — expose those tokens as utility colors

## Out of scope
- Admin dashboard
- Backend schema changes (certifications, marketing budgets stay mock for now)
- Tier/rebate configuration UI (already exists in Configure)

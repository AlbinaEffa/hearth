---
name: Hearth
version: 2.0
style: Warm Minimalism / Soft UI
colors:
  # — Surfaces (warm neutral foundation, layered by tone not by texture) —
  surface: '#fdf9f3'
  surface-dim: '#efeae2'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf6f0'
  surface-container: '#f4efe8'
  surface-container-high: '#ede8e0'
  surface-container-highest: '#e6e1d8'
  surface-variant: '#ece6dd'
  # — Text & lines —
  on-surface: '#211d1a'          # primary text — warm near-black, never pure #000
  on-surface-variant: '#4f453f'  # secondary text (AA on all surfaces)
  on-surface-muted: '#6e635c'    # tertiary text / captions ONLY at >=14px
  outline: '#c9beb5'             # borders & dividers — NOT for text
  outline-variant: '#e4dcd3'     # hairline dividers
  inverse-surface: '#322e2a'
  inverse-on-surface: '#f5f0ea'
  # — Primary (Terracotta) —
  primary: '#a14a2c'
  on-primary: '#ffffff'
  primary-hover: '#8c3e23'
  primary-pressed: '#763218'
  primary-container: '#ffdbcf'
  on-primary-container: '#3a1100'
  inverse-primary: '#ffb59b'
  # — Secondary (Honey / window light) — accents & highlights only —
  secondary: '#7a6a2e'
  on-secondary: '#ffffff'
  secondary-container: '#f7e7a8'
  on-secondary-container: '#4a3d12'
  # — Tertiary (Sage) — growth & calm accents —
  tertiary: '#4a6545'
  on-tertiary: '#ffffff'
  tertiary-container: '#cfe6c6'
  on-tertiary-container: '#16300f'
  # — Reward (Coin gold) — the in-app currency, distinct from real money —
  reward: '#c79023'
  on-reward: '#3a2800'
  reward-container: '#fbe9b8'
  # — Semantic —
  success: '#3f7d4a'
  on-success: '#ffffff'
  success-container: '#cdeccf'
  warning: '#9a6b16'
  on-warning: '#ffffff'
  warning-container: '#fbe6bd'
  error: '#b3261e'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#410002'
  info: '#3c6471'
  on-info: '#ffffff'
  # — Aliases kept for backward-compat with existing screens —
  background: '#fdf9f3'
  on-background: '#211d1a'
  surface-tint: '#a14a2c'
typography:
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
  fontFamilyNumeric: "'Plus Jakarta Sans', sans-serif"   # use font-variant-numeric: tabular-nums for balances
  display-lg:                     # hero numbers: wallet balance, big stats
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-lg:                    # screen titles
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:                    # section headers
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:                       # card titles, list-item titles
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  label-md:                       # buttons, tabs, chips
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: '0'
  caption:                        # timestamps, helper text — never below 12px
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
rounded:
  none: 0
  sm: 8px      # chips, small controls
  md: 12px     # inputs, secondary buttons
  lg: 16px     # primary buttons
  xl: 20px     # cards
  2xl: 28px    # hero cards, sheets, modals
  full: 9999px # pills, avatars, FAB
spacing:
  unit: 4px    # base grid — every gap is a multiple of 4
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  screen-margin: 20px
  card-padding: 20px
  section-gap: 28px
elevation:
  # Warm-neutral, low-opacity, multi-layer. NO terracotta-tinted shadows.
  level-0: 'none'
  level-1: '0 1px 2px rgba(33,29,26,0.05), 0 1px 3px rgba(33,29,26,0.04)'   # cards at rest
  level-2: '0 4px 12px rgba(33,29,26,0.07), 0 2px 4px rgba(33,29,26,0.04)'  # raised / hover
  level-3: '0 12px 28px rgba(33,29,26,0.12), 0 4px 8px rgba(33,29,26,0.06)' # FAB, sheets
  level-4: '0 24px 48px rgba(33,29,26,0.16)'                                # modals, dialogs
  focus-ring: '0 0 0 3px rgba(161,74,44,0.28)'                              # keyboard/active focus
motion:
  duration-fast: 120ms      # taps, toggles, hover
  duration-base: 220ms      # most transitions, enter/exit
  duration-slow: 380ms      # sheets, page transitions, celebratory
  ease-standard: 'cubic-bezier(0.2, 0, 0, 1)'      # default
  ease-emphasized: 'cubic-bezier(0.3, 0, 0, 1)'    # large surfaces, sheets
  ease-spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)' # rewards, coin counts, mascot
opacity:
  disabled: 0.38
  hover-overlay: 0.06
  pressed-overlay: 0.10
zIndex:
  base: 0
  nav: 100
  sticky-header: 200
  fab: 300
  sheet: 400
  modal: 500
  toast: 600
---

## Philosophy

**Warm Minimalism.** Hearth should feel like a calm, well-kept home — not a craft fair. The previous system leaned on literal skeuomorphism (fabric textures, pushpins, stitched borders, "fluffy" terracotta shadows, recessed wells), which reads as dated. The warmth now comes from **color, generous space, soft geometry, and gentle motion** — not from imitating physical materials.

Three rules that keep it modern:
1. **Tone over texture.** Separate layers with subtle changes in surface tone and one soft neutral shadow. No grain, no fabric, no faux-3D.
2. **One accent at a time.** Each screen has a single primary action and a single dominant accent color. Everything else is neutral.
3. **Restraint is the feature.** Whitespace, alignment, and a strict type scale do the heavy lifting. Decoration is the exception, earned by moments of delight (rewards, completed tasks, the mascot).

The brand personality stays gentle, supportive, and homey — expressed through warm neutrals, rounded forms, friendly copy, and the mascot used sparingly in empty/celebratory states.

## Colors

A warm-neutral foundation with a focused accent system. Use **semantic intent**, not raw hex, when building screens.

- **Primary — Terracotta (`primary`)**: the single call-to-action color. Solid fills with `on-primary` text. Hover/pressed use `primary-hover` / `primary-pressed`.
- **Secondary — Honey (`secondary-container`)**: highlights, "needs attention," soft active states. An accent, never a CTA fill with light text.
- **Tertiary — Sage (`tertiary`)**: success, growth, calm/positive accents and progress.
- **Reward — Coin Gold (`reward`)**: reserved exclusively for the in-app currency (coins, balances, earning). This visually separates *play money* from real money — never use gold for real-currency amounts.
- **Surfaces**: build depth with the `surface-container-*` ramp (lowest → highest), not shadows alone. Cards sit one tone above their background.

### Contrast & usage rules (non-negotiable)
- Body and UI text use `on-surface`; secondary text uses `on-surface-variant`. **`on-surface-muted` only at ≥14px**, and **`outline` is for borders/dividers only — never text.**
- Maintain **WCAG AA: ≥4.5:1** for text, **≥3:1** for icons, borders, and UI states.
- Never place light text on `secondary-container` / honey — it fails contrast. Use `on-secondary-container`.
- Don't communicate state by color alone (color-blind safe): pair color with an icon or label (e.g. success = sage + check).

## Typography

**Plus Jakarta Sans** throughout — its rounded terminals carry the friendly tone without needing decoration. Use the scale verbatim; do not invent in-between sizes.

- Headlines: tight tracking, weight 600–700, to feel grounded.
- Body: weight 400, line-height 1.5–1.6 for comfortable reading.
- **Numbers** (balances, coins, stats): use `display-lg`/`headline` with `font-variant-numeric: tabular-nums` so digits don't jump when they change.
- All text renders in `on-surface` (`#211d1a`) — a warm near-black. (Supersedes the old `#3E3636` note.)

## Layout & Spacing

- **4px base grid.** Every margin, padding, and gap is a multiple of 4. Use the named scale (`xs`–`3xl`).
- **20px screen margins**, **20px card padding**, **28px between major sections** — breathing room is the look.
- One-column, vertically-rhythmic layouts. Avoid asymmetric "scattered furniture" arrangements from v1 — they read as messy, not organic. Align to a single left edge; group related items into clean cards.
- Minimum **44×44px touch targets** for every interactive element.
- Respect safe areas; the bottom nav and FAB never overlap scrollable content (add bottom padding equal to nav height + 16px).

## Elevation & Depth

Depth is **tonal first, shadow second**.
- Resting cards: `surface-container-low/­` + `elevation level-1`.
- Raised/interactive (hover, dragged task): `level-2`.
- Floating (FAB, bottom sheet): `level-3`. Modals/dialogs: `level-4` over a scrim `rgba(33,29,26,0.4)`.
- Shadows are warm-neutral and low-opacity — **never terracotta-tinted, never "pillowy."** No inner shadows, no faux bevels.

## Shapes

Soft, consistent, intentional radii — no sharp corners, no over-rounding.
- **Cards:** `xl` (20px). Hero/featured cards & sheets: `2xl` (28px).
- **Buttons:** `lg` (16px) for standard; `full` pill only for compact/icon actions.
- **Inputs:** `md` (12px).
- **Chips:** `full` pill or `sm`.
- **Avatars & FAB:** `full`.

## Components

- **Buttons.** Flat, confident fills — **drop the v1 fake 2px "pressable" bottom border.** Primary: `primary` fill, `on-primary` text, `label-md`, radius `lg`, min height 52px, full-width as the screen's one CTA. Press → `primary-pressed` + scale 0.98 (`duration-fast`, `ease-standard`). Secondary: transparent with `outline` border or `surface-container-high` fill. Tertiary/text: no fill, `primary` label. Disabled: `opacity disabled`, no shadow.
- **Cards.** `surface-container-low` (or `lowest` on tinted backgrounds), radius `xl`, padding `card-padding`, `elevation level-1`. **No textures, no pushpins.** A "needs attention" card may use a left accent bar or a soft `secondary-container` tint instead of sticky-note skeuomorphism.
- **Inputs.** Filled style: `surface-container` background, `md` radius, 1px `outline` border, comfortable 14–16px padding. **No recessed inner shadow.** Focus: 2px `primary` border + `focus-ring`. Error: `error` border + helper text in `error`. Labels above the field in `label-md`.
- **Chips / tags.** Clean pills — **remove dashed "stitching" borders.** Filled tonal (`surface-container-high` / `secondary-container` / `tertiary-container`) with matching `on-*` text. Optional leading icon.
- **Bottom navigation.** A clean bar — **not a "wooden mantle."** `surface-container-lowest`, hairline top divider (`outline-variant`), `level-2`. 4–5 destinations, icon + `caption` label. Active: `primary` icon + label + a small pill/dot indicator; inactive: `on-surface-muted`. Keep the destination set **fixed and identical across the app** (see Information Architecture).
- **FAB.** Single primary action, `primary` fill, `full` radius, 56px, `level-3`, bottom-right above the nav. Press → spring scale.
- **Progress.** Simple rounded track (`surface-container-high`) + `tertiary` (or `reward` for coin goals) fill, animated with `duration-base`. Retire literal "growing vine / filling kettle" metaphors as the default; reserve illustrative progress for one hero moment only.
- **Mascot.** One mascot, used **only** in empty states, onboarding, and reward celebrations — never as chrome on every screen. Flat/vector illustration style, consistent with the UI (no photoreal stock imagery).
- **Avatars.** `full` radius, 1px `outline-variant` ring; active/selected gets a 2px `primary` ring.

## Motion

Calm and quick. Use the `motion` tokens.
- Taps/toggles: `duration-fast` + `ease-standard`.
- Enter/exit, expand/collapse: `duration-base` + `ease-standard`.
- Sheets & page transitions: `duration-slow` + `ease-emphasized`.
- Rewards, coin counters, mascot, completed-task check: `ease-spring` for a gentle bounce.
- Respect `prefers-reduced-motion`: drop transforms/bounces, keep simple opacity fades.

## Iconography

**Material Symbols (Rounded)**, weight 400, optical size 24, to match the rounded type. Single consistent set — no mixing line/filled families. Active states may use the filled variant. Icon color follows text intent (`on-surface-variant` default, `primary` when active).

## Information Architecture (nav consistency)

v1 shipped four different bottom-nav sets. Lock to **one** model per role (matches the implemented `.bottom-nav` component):
- **Adult:** Главная · Задачи · ＋ (new task FAB, raised center) · Неделя · Награды
- **Child:** Главная · Задачи · Кладовая · Кошелёк

The set is fixed per role; labels, icons, and order never change between screens. Settings and house management live inside Profile, not as a rotating tab.

## Shared stylesheet

The system is implemented once in **`assets/hearth.css`** (CSS variables for every token above + component classes: `.topbar`, `.card`, `.btn`/`.btn-primary`, `.chip*`, `.input`, `.coin`, `.track`, `.bottom-nav`/`.nav-item`/`.fab`, typography `.h1/.h2/.title/.body/.caption`). Every screen links it — do not re-declare colors, shadows, or radii inline. Link with `<link rel="stylesheet" href="../assets/hearth.css">`.

## Brand & Localization

- **One name: "Hearth"** (retire "Cozy House" / "Family Hive"). **One mascot — Тёпа (see below).**
- Full localization per locale — **never mix languages within a screen.** Russian and English copy live in separate string sets; the UI renders one.
- Real currency and in-app **coins** are always visually and verbally distinct (gold `reward` token + coin icon for coins; neutral text for money).

## Mascot — Тёпа (домовой)

The brand mascot is **Тёпа**, a friendly **домовой** (Slavic house spirit / guardian of the hearth) — chosen because it ties directly to the name *Hearth* (очаг) and to the "keeper of a warm home" idea. Flat-vector, rounded, no skeuomorphism — built from the same palette as the UI.

**Mascot palette** (derived from system tokens): fur `#cf9356` / fur-shadow `#bd7e42`; beard, brim & belly `#fdf9f3`; cap `primary #a14a2c` / `#7d3a20`; nose `#9a4226`; cheeks `#e8987a`; eyes `#2b2420`; sparkles `reward #e7b53f`.

**Assets** — `cozy_house/assets/mascot/` (SVG, 240×260, transparent):
- `hearth-domovoi-idle.svg` — neutral. Header avatar (circular crop), profile, default presence.
- `hearth-domovoi-wave.svg` — greeting. Onboarding, welcome, first-run.
- `hearth-domovoi-sleep.svg` — resting. Empty states ("no tasks", "wallet empty").
- `hearth-domovoi-cheer.svg` — celebrating. Reward redeemed, task completed, goal reached.

**Usage rules:**
- One mascot only — retire the corgi, the ginger cat, and the bear.
- Use **sparingly and purposefully**: empty states, onboarding, and reward/celebration moments — plus the header/profile avatar (idle, circular-cropped). Never as decorative chrome on every card.
- Keep the flat-vector style; **never** pair with photoreal imagery.
- Circular avatar = crop to head+cap+beard (local viewBox `38 30 160 160`); works down to 28px.
- Animate only on celebratory moments (`ease-spring`); respect `prefers-reduced-motion`.

# 🐎 Chibani AI — Tiref / Quinté Analysis

A premium, mobile-first web app that analyses Moroccan horse racing (Tiref /
Quinté) using an LLM engine ("**Chibani AI**"), with a universal multi-language
search (Darija 🇲🇦 / Arabic / French 🇫🇷) and strict glossary + entity
protection so horse names and technical terms are **never** mistranslated.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**,
**Framer Motion**, **Supabase** (Auth + DB) and **NextAuth** (Google, Apple,
Phone OTP).

---

## ✨ Features

| Area | What's implemented |
|------|--------------------|
| **Auth** | NextAuth: Google + Apple OAuth, Phone OTP (Twilio Verify) — `src/lib/auth.ts` |
| **Universal search** | Any script/language → normalized → fuzzy race match — `src/lib/normalize.ts`, `src/lib/data.ts`, `/api/search` |
| **Chibani engine** | 4-method analysis (Digital Logic · Race Conditions · Coup de Poker · Final Pronostic) — `src/lib/llm.ts`, `/api/analyze` |
| **Glossary protection** | Protected terms + entity rules baked into the system prompt + a post-gen audit — `src/lib/glossary.ts` |
| **Localization** | LLM writes commentary in Darija / Arabic / French; UI copy in `src/lib/i18n.ts` |
| **Premium UI** | Deep-black dark mode, luxury gold + racing green, Framer Motion, running-horse loader |
| **Monetization** | AdSense placeholders (top / mid / bottom) + credit system (3 free/day → rewarded ad or Premium) — `src/lib/credits.ts` |

---

## 🗂 Folder structure

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout, fonts (Latin + Arabic), metadata
│   │   ├── globals.css               # Tailwind + theme, gold sheen, scrollbar
│   │   ├── page.tsx                  # Landing / hero
│   │   ├── dashboard/
│   │   │   └── page.tsx              # ★ Main app: search + lang + credits + analysis
│   │   └── api/
│   │       ├── search/route.ts       # Multi-language race search
│   │       ├── analyze/route.ts      # ★ Chibani analysis (credit-gated + protection audit)
│   │       ├── credits/route.ts      # Credit state + rewarded-ad grant
│   │       └── auth/[...nextauth]/route.ts
│   ├── components/
│   │   ├── SearchBar.tsx             # Universal debounced search + suggestions
│   │   ├── LanguageSwitcher.tsx      # Darija / Arabic / French pill switch
│   │   ├── AnalysisPanel.tsx         # The 4 method cards
│   │   ├── CreditMeter.tsx           # Credits + watch-ad / upgrade CTAs
│   │   ├── HorseLoader.tsx           # Running-horse + radar loading animation
│   │   └── AdSlot.tsx                # CLS-safe AdSense placeholders
│   ├── lib/
│   │   ├── llm.ts                    # ★ System prompt + provider calls + parsing
│   │   ├── glossary.ts               # ★ Protected terms + entity rules + audit
│   │   ├── normalize.ts              # Query normalization (Arabic/Latin folding)
│   │   ├── data.ts                   # Mock race source + fuzzy matcher
│   │   ├── i18n.ts                   # UI dictionary + language metadata
│   │   ├── credits.ts               # Token/credit architecture
│   │   ├── auth.ts                   # NextAuth options (Google/Apple/OTP)
│   │   ├── cn.ts                     # className helper
│   │   └── supabase/{client,server}.ts
│   ├── types/index.ts               # Domain types (Race, Analysis, Credit…)
│   └── middleware.ts                # Supabase session refresh
├── tailwind.config.ts               # Ink / gold / racing palette + animations
├── .env.example
└── package.json
```

`★` = the three explicit deliverables (Dashboard, analysis API, glossary-protected LLM prompt).

---

## 🚀 Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys (works in demo mode without them)
npm run dev                  # http://localhost:3000
```

Without an `ANTHROPIC_API_KEY` the analysis engine returns a **structure-accurate
mock** (in dev) so the full UX is demoable offline. Add the key to get real
Chibani AI analysis.

---

## 🧠 Glossary & entity protection (how it works)

The LLM system prompt (`buildSystemPrompt` in `src/lib/llm.ts`) contains three
non-negotiable blocks:

1. **Language & localization** — commentary written naturally in the selected
   language; meaning localized, not word-for-word.
2. **Protected technical terms** (`glossary.ts`) — *Quinté, Tiercé, Quarté,
   Musique, Corda, Autostart, …* are kept verbatim, even inside Arabic text.
3. **Entity protection (absolute)** — horse / jockey / trainer / track names and
   proper-noun race titles ("Bold Eagle", "Prix d'Amérique") are **never
   translated**; an optional phonetic transliteration may be added in
   parentheses on first mention, but the Latin original always stays.

After generation, `findDroppedTerms` runs a best-effort audit and the
`/api/analyze` response reports `protection.ok`.

---

## 💳 Credit system

`src/lib/credits.ts` exposes a storage-agnostic interface (in-memory for dev;
swap for a Supabase adapter in prod). Default: **3 free analyses/day**, then
either watch a **rewarded ad** (`POST /api/credits {reward:true}`, +1) or
**upgrade to Premium** (unlimited). `/api/analyze` returns `402` when the user
is out of credits.

### Suggested Supabase schema

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  premium boolean default false,
  created_at timestamptz default now()
);

create table credit_buckets (
  user_id uuid references profiles(id) on delete cascade,
  day date not null,
  used int default 0,
  primary key (user_id, day)
);

create table favorites (
  user_id uuid references profiles(id) on delete cascade,
  race_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, race_id)
);

create table analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  race_id text not null,
  lang text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);
```

---

## 🎨 Design language

- **Base:** deep blacks / dark grays (`ink.*`).
- **Accents:** luxury **gold** (`gold.*`) + **racing green** (`racing.*`).
- **Motion:** Framer Motion for page/element transitions, hover states, the
  language pill, and the running-horse + radar analysis loader.
- **RTL-aware:** the dashboard flips direction for Darija / Arabic automatically.

> ⚠️ Informational analysis only. Play responsibly · +18.

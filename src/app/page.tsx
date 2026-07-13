import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

// Landing page — routes users into the dashboard.
export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-sm text-gold-300">
        <Sparkles className="h-4 w-4" /> Chibani AI · Tiref / Quinté
      </div>

      <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
        <span className="text-sheen">الشيباني</span>{" "}
        <span className="text-white">reads the race,</span>
        <br />
        <span className="text-white/80">so you play smart.</span>
      </h1>

      <p className="mt-6 max-w-xl text-lg text-white/50">
        AI-powered horse racing analysis for Morocco — Digital Logic, Race Conditions, Coup de
        Poker &amp; a Final Pronostic, in Darija 🇲🇦, Arabic or Français 🇫🇷.
      </p>

      <Link
        href="/dashboard"
        className="group mt-10 inline-flex items-center gap-2 rounded-full bg-gold-sheen bg-[length:200%_auto] px-7 py-3.5 text-base font-semibold text-ink-950 shadow-gold transition-all hover:animate-sheen"
      >
        Enter the Dashboard
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Link>

      <p className="mt-6 text-xs text-white/30">Play responsibly · +18</p>
    </main>
  );
}

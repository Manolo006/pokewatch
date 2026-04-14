import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import LanguageText from "./LanguageText";

type NavbarProps = {
  badgeLabel?: string;
  maxWidthClassName?: string;
  rightContent?: ReactNode;
};

export default function Navbar({
  badgeLabel = "SETTINGS",
  maxWidthClassName = "max-w-300",
  rightContent,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className={`mx-auto flex w-full ${maxWidthClassName} flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8`}>
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Vai alla home">
            <Image src="/logo.png" alt="PokéWatch" width={170} height={40} className="h-auto w-32.5 sm:w-42.5" priority />
          </Link>
          <span className="rounded bg-[#e50914] px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-white">{badgeLabel}</span>
        </div>

        <nav className="mobile-top-nav order-3 flex w-full items-center gap-4 overflow-x-auto whitespace-nowrap text-[11px] uppercase tracking-widest text-white/70 sm:order-none sm:w-auto sm:gap-6 sm:text-xs">
          <Link href="/" className="transition hover:text-white">
            <LanguageText textKey="home" />
          </Link>
          <a href="#" className="transition hover:text-white">
            <LanguageText textKey="seriesTv" />
          </a>
          <Link href="/timeline" className="transition hover:text-white">
            <LanguageText textKey="timeline" />
          </Link>
        </nav>

        {rightContent ? <div className="flex items-center gap-2">{rightContent}</div> : null}
      </div>
    </header>
  );
}
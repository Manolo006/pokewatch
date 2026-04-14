import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

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
      <div className={`mx-auto flex w-full ${maxWidthClassName} items-center justify-between gap-4 px-4 py-4 sm:px-8`}>
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Vai alla home">
            <Image src="/logo.png" alt="PokéWatch" width={170} height={40} className="h-auto w-32.5 sm:w-42.5" priority />
          </Link>
          <span className="rounded bg-[#e50914] px-2.5 py-1 text-[10px] font-black tracking-[0.16em] text-white">{badgeLabel}</span>
        </div>

        {rightContent ? <div className="flex items-center gap-2">{rightContent}</div> : null}
      </div>
    </header>
  );
}
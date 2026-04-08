import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/70">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-start gap-4 px-3 py-5 text-xs text-white/70 sm:px-8 sm:text-sm">
        <Link href="/" className="shrink-0">
          <img src="/logo.png" alt="PokéWatch" width={110} height={26} className="h-auto w-[92px] sm:w-[110px]" />
        </Link>
        <p>© 2026 PokéWatch. Tutti i diritti riservati.</p>
        <Link href="/privacy" className="ml-auto underline hover:text-white">
          Privacy
        </Link>
      </div>
    </footer>
  );
}
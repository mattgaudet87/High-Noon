import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-orange-400 via-orange-600 to-amber-800 px-6 text-center">
      <h1 className="text-6xl font-black tracking-wide text-amber-50 drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] sm:text-7xl">
        HIGH NOON
      </h1>
      <p className="max-w-sm text-amber-100/90">
        Send your lawmen down the street and take the outlaw Hideout.
      </p>
      <Link
        href="/play"
        className="rounded-full border-4 border-amber-900 bg-amber-50 px-10 py-4 text-xl font-bold uppercase tracking-widest text-amber-900 shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        Ride Out
      </Link>
    </div>
  );
}

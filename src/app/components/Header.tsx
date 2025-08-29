"use client";
import Link from "next/link";
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between px-4 md:px-6 bg-emerald-800 text-white border-b border-white/10">
      {/* Left: SALT logo + lockup */}
      <Link href="/salt" className="group flex items-center gap-2" aria-label="SALT home">
        {/* Use the exact provided SVG */}
        <img
          src="/salt-logo.svg"
          alt="SALT — Sales & Analytics Lab for Team"
          className="h-7 w-auto opacity-90 group-hover:opacity-100"
          fetchPriority="high"
        />
        <div className="leading-tight">
          <div className="flex items-baseline gap-1">
            <span className="font-semibold lowercase">inecta</span>
            <span className="opacity-70">·</span>
            <span className="font-semibold">SALT</span>
          </div>
          <span className="hidden sm:block text-[11px] opacity-75">
            Sales &amp; Analytics Lab for Team
          </span>
        </div>
      </Link>

      {/* Right: user menu (using existing auth-aware component) */}
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <span className="text-white/80">{user.email}</span>
            <button onClick={handleSignOut} className="underline hover:text-white/80">
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/auth" className="underline hover:text-white/80">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

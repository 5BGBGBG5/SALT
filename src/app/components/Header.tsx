"use client";
import Link from "next/link";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isReportsOpen, setIsReportsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsReportsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reportLinks = [
    { href: '/reports/post-engagement', label: 'Post Engagement Report' },
    { href: '/reports/aieo', label: 'AiEO Report' },
    { href: '/reports/competition-heatmap', label: 'Competition Heat Map' },
  ];

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between px-4 md:px-6 bg-emerald-800 text-white border-b border-white/10">
      {/* Left: SALT logo + lockup + navigation */}
      <div className="flex items-center gap-6">
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

        {/* Navigation Menu */}
        {user && (
          <nav className="flex items-center space-x-1">
            <Link 
              href="/" 
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === '/' || pathname === '/salt'
                  ? 'bg-white/20 text-white' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Home
            </Link>
            
            {/* Reports Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsReportsOpen(!isReportsOpen)}
                className={`flex items-center px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  pathname.startsWith('/reports')
                    ? 'bg-white/20 text-white' 
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                Reports
                <ChevronDown className={`ml-1 w-3 h-3 transition-transform ${isReportsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isReportsOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {reportLinks.map((report) => (
                    <Link
                      key={report.href}
                      href={report.href}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        pathname === report.href
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setIsReportsOpen(false)}
                    >
                      {report.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Right: user menu */}
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

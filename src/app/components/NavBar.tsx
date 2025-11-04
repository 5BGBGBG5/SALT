"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

export default function NavBar() {
  const { user, signOut, loading } = useAuth();
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
    { href: '/reports/battlecards', label: 'Battlecards' },
    { href: '/reports/dashboard', label: 'Competitive Intelligence Dashboard' },
    { href: '/reports/geo-similarities', label: 'GEO Similarities' },
  ] as const;

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              SALT — inecta
            </Link>
            
            {user && (
              <div className="flex space-x-1">
                <Link 
                  href="/" 
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Home
                </Link>
                
                {/* Reports Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsReportsOpen(!isReportsOpen)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith('/reports') || pathname.startsWith('/dashboard')
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Reports
                    <ChevronDown className={`ml-1 w-4 h-4 transition-transform ${isReportsOpen ? 'rotate-180' : ''}`} />
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
                
                <Link 
                  href="#" 
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Placeholder
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/auth"
                    className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

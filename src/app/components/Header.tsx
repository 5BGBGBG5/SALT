"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
    { href: '/reports/competition-heatmap', label: 'Competition Heat Map' },
    { href: '/reports/battlecards', label: 'Battlecards' },
    { href: '/reports/competitor-content', label: 'Competitor Content Report' },
    { href: '/reports/dashboard', label: 'Competitive Intelligence Dashboard' },
    { href: '/reports/bdr-calls-transcript', label: 'BDR Calls Transcript' },
  ];

  return (
    <header className="fixed top-0 z-50 w-full px-4 py-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card mx-auto max-w-7xl px-6 py-3 flex items-center justify-between"
      >
        {/* Left: SALT logo + lockup with glow effect */}
        <div className="flex items-center gap-3 group">
          <Link href="/salt" className="flex items-center gap-3" aria-label="SALT home">
            <Image
              src="/salt-logo.svg"
              alt="SALT — Sales & Analytics Lab for Team"
              width={32}
              height={32}
              className="h-8 w-auto transition-all duration-300 group-hover:filter group-hover:brightness-125 group-hover:drop-shadow-[0_0_10px_rgba(0,204,204,0.5)]"
              priority
            />
            <div className="text-text-primary">
              <div className="flex items-baseline gap-1">
                <span className="font-semibold lowercase tracking-wide">inecta</span>
                <span className="opacity-70 text-accent-primary">·</span>
                <span className="font-semibold text-glow">SALT</span>
              </div>
              <div className="text-xs text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Sales & Analytics Lab
              </div>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Menu with animated underlines */}
        <div className="flex-1 flex justify-center">
          {user && (
            <nav className="flex items-center space-x-2">
              {/* Upload Link */}
              <Link
                href="/upload"
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                  pathname === '/upload'
                    ? 'text-accent-primary bg-accent-primary/10' 
                    : 'text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5'
                }`}
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Upload
                </motion.span>
                
                {/* Animated underline */}
                {pathname === '/upload' && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-success"
                    layoutId="activeTab"
                  />
                )}
              </Link>

              {/* Monthly KPI Link */}
              <Link
                href="/monthly-kpi"
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                  pathname === '/monthly-kpi'
                    ? 'text-accent-primary bg-accent-primary/10' 
                    : 'text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5'
                }`}
              >
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Monthly KPI
                </motion.span>
                
                {/* Animated underline */}
                {pathname === '/monthly-kpi' && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-success"
                    layoutId="activeTab"
                  />
                )}
              </Link>

              {/* Reports Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <motion.button
                  onClick={() => setIsReportsOpen(!isReportsOpen)}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                    pathname.startsWith('/reports') || pathname.startsWith('/dashboard')
                      ? 'text-accent-primary bg-accent-primary/10' 
                      : 'text-text-secondary hover:text-accent-primary hover:bg-accent-primary/5'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reports
                  <ChevronDown className={`ml-2 w-4 h-4 transition-transform duration-300 ${isReportsOpen ? 'rotate-180' : ''}`} />
                  
                  {/* Animated underline */}
                  {(pathname.startsWith('/reports') || pathname.startsWith('/dashboard')) && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-success"
                      layoutId="activeTab"
                    />
                  )}
                </motion.button>
                
                <AnimatePresence>
                  {isReportsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-72 glass-card py-2 z-50"
                    >
                      {reportLinks.map((report, index) => (
                        <motion.div
                          key={report.href}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Link
                            href={report.href}
                            className={`block px-4 py-3 text-sm transition-all duration-300 rounded-lg mx-2 ${
                              pathname === report.href
                                ? 'bg-accent-primary/20 text-accent-primary border-l-2 border-accent-primary'
                                : 'text-text-secondary hover:bg-accent-primary/10 hover:text-accent-primary'
                            }`}
                            onClick={() => setIsReportsOpen(false)}
                          >
                            {report.label}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          )}
        </div>

        {/* Right: User menu with avatar */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-text-secondary text-sm hidden sm:block">{user.email}</span>
              <div className="flex items-center gap-3">
                {/* User avatar with status indicator */}
                <div className="relative">
                  <div className="w-2 h-2 bg-accent-success rounded-full absolute -top-0.5 -right-0.5 animate-pulse-glow"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-primary to-accent-success flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                    {user.email?.[0].toUpperCase()}
                  </div>
                </div>
                <motion.button 
                  onClick={handleSignOut} 
                  className="btn-secondary text-xs px-3 py-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign Out
                </motion.button>
              </div>
            </>
          ) : (
            <Link href="/auth">
              <motion.button 
                className="btn-primary text-sm px-4 py-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </Link>
          )}
        </div>
      </motion.div>
    </header>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SearchInput from './components/SearchInput';
// Dynamic imports for Supabase-dependent components
// import UploadDropzone from './components/UploadDropzone';
// import BigUpload from './components/BigUpload'; // Uncomment when needed
import PoweredBySALT from './components/PoweredBySALT';
import ProtectedRoute from './components/ProtectedRoute';

interface UploadDropzoneProps {
  userId: string;
  onUploadComplete: (url: string, path: string) => void;
}

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [UploadDropzone, setUploadDropzone] = useState<React.ComponentType<UploadDropzoneProps> | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import UploadDropzone only on client side
    import('./components/UploadDropzone').then((module) => {
      setUploadDropzone(() => module.default);
    });
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-teal-600/20 animate-pulse"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-teal-400/30 rounded-full"
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        {/* Main content */}
        <motion.div 
          className="w-full max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Welcome message */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-teal-200 to-emerald-200 bg-clip-text text-transparent mb-4">
              Welcome to SALT
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Your Sales & Analytics Lab for Team insights and competitive intelligence
            </p>
          </motion.div>

          {/* Command Palette with glass effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mb-8"
          >
            <SearchInput />
          </motion.div>

          {/* File Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mb-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">File Upload</h2>
              <p className="text-gray-400 text-sm mb-6">
                Upload files directly to Supabase Storage, bypassing Vercel&apos;s body limits
              </p>
            </div>
            
            {/* Simple uploader for small/medium files - only render on client */}
            {isClient && UploadDropzone && (
              <div className="mb-8">
                <UploadDropzone 
                  userId="demo-user-id"
                  onUploadComplete={(url: string, path: string) => {
                    console.log('Upload completed:', { url, path });
                  }}
                />
              </div>
            )}
            
            {/* TODO: Uncomment below to use TUS uploader for large files instead */}
            {/*
            <div className="mb-8">
              <BigUpload
                supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
                supabaseAnonKey={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}
                userId="demo-user-id"
                onUploadComplete={(objectName) => {
                  console.log('TUS upload completed:', objectName);
                }}
              />
            </div>
            */}
          </motion.div>

          {/* Powered by SALT */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <PoweredBySALT />
          </motion.div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
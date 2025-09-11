"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for form fields
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState('');
  const [newCompetitorName, setNewCompetitorName] = useState('');
  const [showNewCompetitor, setShowNewCompetitor] = useState(false);
  const [verticals, setVerticals] = useState('');
  const [sourceType, setSourceType] = useState('battlecard');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Dynamically import UploadDropzone only on client side
    import('./components/UploadDropzone').then((module) => {
      setUploadDropzone(() => module.default);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    console.log('Selected file:', selectedFile);
  };

  // Placeholder for fetching competitors (will be replaced or expanded later)
  const fetchCompetitors = async () => {
    console.log('Fetching competitors...');
    // In a real application, this would fetch data from an API
    // For now, it's just a placeholder to avoid errors.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    const finalCompetitor = selectedCompetitor === '__new__' ? newCompetitorName : selectedCompetitor;

    // Use FormData to handle both file and text data
    const submissionData = new FormData();
    submissionData.append('competitorSelect', selectedCompetitor);
    submissionData.append('newCompetitorName', showNewCompetitor ? newCompetitorName : '');
    submissionData.append('competitor', finalCompetitor);
    submissionData.append('verticals', verticals); // Send as a comma-separated string
    submissionData.append('sourceType', sourceType);
    submissionData.append('content', content);

    if (file) {
      submissionData.append('file', file);
    }

    console.log('FormData entries before fetch in page.tsx:');
    for (const [key, value] of submissionData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: [File] ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    try {
      // The fetch request should NOT have a Content-Type header when sending FormData
      const response = await fetch('https://inecta.app.n8n.cloud/webhook/upload-battlecard', {
        method: 'POST',
        body: submissionData,
      });

      if (response.ok) {
        setSuccessMessage(`Battlecard for ${finalCompetitor} uploaded successfully!`);

        // Reset form state
        setSelectedCompetitor('');
        setNewCompetitorName('');
        setVerticals('');
        setContent('');
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setShowNewCompetitor(false);

        // Refresh the list of competitors if a new one was added
        if (selectedCompetitor === '__new__') {
          fetchCompetitors();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed. The server responded with an error.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload battlecard. Please check the console and try again.');
    } finally {
      setLoading(false);
    }
  };

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
            
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              id="file-upload"
            />
            
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

          {/* Battlecard Upload Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mb-8"
          >
            {/* Existing BattlecardUpload component will be replaced or modified to use new state */}
            {/* For now, just a placeholder to show the form elements */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Upload Battlecard</h2>
              {/* Example Form Fields (replace with actual UI components) */}
              <div>
                <label className="block text-sm font-medium text-gray-300">Competitor</label>
                <input type="text" value={selectedCompetitor} onChange={(e) => setSelectedCompetitor(e.target.value)} className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white" />
              </div>
              {showNewCompetitor && (
                <div>
                  <label className="block text-sm font-medium text-gray-300">New Competitor Name</label>
                  <input type="text" value={newCompetitorName} onChange={(e) => setNewCompetitorName(e.target.value)} className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300">Verticals (comma-separated)</label>
                <input type="text" value={verticals} onChange={(e) => setVerticals(e.target.value)} className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Source Type</label>
                <input type="text" value={sourceType} onChange={(e) => setSourceType(e.target.value)} className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300">Content</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md text-white" rows={4}></textarea>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Upload File</label>
              {file && <p className="text-sm text-gray-400">Selected file: {file.name}</p>}
              <button type="submit" disabled={loading} className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
                {loading ? 'Uploading...' : 'Upload Battlecard'}
              </button>
              {errorMessage && <p className="text-red-500 mt-2">Error: {errorMessage}</p>}
              {successMessage && <p className="text-green-500 mt-2">Success: {successMessage}</p>}
            </form>
          </motion.div>

          {/* Powered by SALT */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
          >
            <PoweredBySALT />
          </motion.div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}
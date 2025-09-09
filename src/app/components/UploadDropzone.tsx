'use client';

import { useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UploadDropzoneProps {
  userId: string;
  onUploadComplete?: (url: string, path: string) => void;
}

export default function UploadDropzone({ userId, onUploadComplete }: UploadDropzoneProps) {
  const [status, setStatus] = useState<string>('Drop a file or click to browse');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    // Reset states
    setError(null);
    setUploadedUrl(null);
    setIsUploading(true);

    try {
      // Check file size (50MB limit for simple uploader)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error('File too large. Use the TUS uploader for files over 50MB.');
      }

      setStatus('Requesting upload token…');
      
      const res = await fetch('/api/storage/create-upload-url', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId,
          filename: file.name,
          contentType: file.type || 'application/octet-stream'
        })
      });

      const result = await res.json();
      if (result.error) {
        throw new Error(result.error);
      }

      const { token, path } = result;

      setStatus(`Uploading ${file.name} to Supabase…`);
      
      const { error: upErr } = await supabase
        .storage
        .from('uploads')
        .uploadToSignedUrl(path, token, file);

      if (upErr) {
        throw new Error(`Upload failed: ${upErr.message}`);
      }

      // Get public URL
      const { data: pub } = supabase.storage.from('uploads').getPublicUrl(path);
      const publicUrl = pub?.publicUrl;

      if (publicUrl) {
        setUploadedUrl(publicUrl);
        setStatus(`Upload complete! File available at: ${path}`);
        onUploadComplete?.(publicUrl, path);
      } else {
        setStatus(`Upload complete! File stored at: ${path}`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setStatus('Upload failed');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative p-8 rounded-2xl border-2 border-dashed transition-all duration-300
          ${dragActive 
            ? 'border-teal-400 bg-teal-400/5 scale-[1.02]' 
            : 'border-white/20 hover:border-teal-400/50'
          }
          ${isUploading ? 'opacity-75' : 'cursor-pointer hover:bg-white/5'}
          backdrop-blur-xl bg-white/5
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {error ? (
              <AlertCircle className="w-12 h-12 text-red-400" />
            ) : uploadedUrl ? (
              <CheckCircle className="w-12 h-12 text-green-400" />
            ) : isUploading ? (
              <div className="w-12 h-12 border-4 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            ) : (
              <Upload className="w-12 h-12 text-teal-400" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">
            {isUploading ? 'Uploading...' : 'Upload to Supabase Storage'}
          </h3>
          
          <p className={`text-sm mb-4 ${error ? 'text-red-400' : 'text-gray-400'}`}>
            {error || status}
          </p>
          
          {uploadedUrl && (
            <div className="w-full p-3 bg-green-400/10 border border-green-400/20 rounded-lg">
              <p className="text-xs text-green-400 break-all">
                <strong>Public URL:</strong> {uploadedUrl}
              </p>
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-4">
            <p>• Supports files up to 50MB</p>
            <p>• For larger files, use the TUS uploader below</p>
            <p>• Files are stored in Supabase Storage</p>
          </div>
        </div>
      </div>
    </div>
  );
}

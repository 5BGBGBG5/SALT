'use client';

import { useState, useRef } from 'react';
import { Upload as UploadIcon, Pause, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Upload } from 'tus-js-client';

interface BigUploadProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
  bucket?: string;
  userId: string;
  onUploadComplete?: (objectName: string) => void;
}

export default function BigUpload({
  supabaseUrl,
  supabaseAnonKey,
  bucket = 'uploads',
  userId,
  onUploadComplete
}: BigUploadProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'paused' | 'completed' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [uploadedPath, setUploadedPath] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<Upload | null>(null);

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
    setProgress(0);
    setStatus('uploading');
    setFileName(file.name);
    setUploadedPath('');

    const objectName = `${userId}/${crypto.randomUUID()}-${file.name}`;
    const endpoint = `${supabaseUrl}/storage/v1/upload/resumable`;

    console.log('Starting TUS upload:', { fileName: file.name, size: file.size, objectName });

    const upload = new Upload(file, {
      endpoint,
      chunkSize: 6 * 1024 * 1024, // 6MB chunks
      retryDelays: [0, 1000, 3000, 5000],
      headers: {
        authorization: `Bearer ${supabaseAnonKey}`,
        'x-upsert': 'true'
      },
      metadata: {
        bucketName: bucket,
        objectName,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600'
      },
      onError: (err) => {
        console.error('TUS upload error:', err);
        setError(err.message || 'Upload failed');
        setStatus('error');
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        setProgress(percentage);
        console.log(`Upload progress: ${percentage}% (${bytesUploaded}/${bytesTotal})`);
      },
      onSuccess: () => {
        console.log('TUS upload completed successfully');
        setProgress(100);
        setStatus('completed');
        setUploadedPath(objectName);
        onUploadComplete?.(objectName);
      }
    });

    uploadRef.current = upload;
    upload.start();
  };

  const pauseUpload = () => {
    if (uploadRef.current && status === 'uploading') {
      uploadRef.current.abort();
      setStatus('paused');
    }
  };

  const resumeUpload = () => {
    if (uploadRef.current && status === 'paused') {
      uploadRef.current.start();
      setStatus('uploading');
    }
  };

  const openFileDialog = () => {
    if (status !== 'uploading') {
      fileInputRef.current?.click();
    }
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
          ${status === 'uploading' ? 'opacity-90' : 'cursor-pointer hover:bg-white/5'}
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
          disabled={status === 'uploading'}
        />
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            {error ? (
              <AlertCircle className="w-12 h-12 text-red-400" />
            ) : status === 'completed' ? (
              <CheckCircle className="w-12 h-12 text-green-400" />
            ) : status === 'uploading' ? (
              <div className="w-12 h-12 border-4 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            ) : (
              <UploadIcon className="w-12 h-12 text-teal-400" />
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">
            TUS Resumable Upload
          </h3>
          
          {fileName && (
            <p className="text-sm text-gray-300 mb-2 font-mono">
              {fileName}
            </p>
          )}
          
          {status === 'idle' && (
            <p className="text-sm text-gray-400 mb-4">
              Drop large files here or click to browse
            </p>
          )}
          
          {error && (
            <p className="text-sm text-red-400 mb-4">
              Error: {error}
            </p>
          )}
          
          {(status === 'uploading' || status === 'paused' || status === 'completed') && (
            <div className="w-full mb-4">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-teal-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          {(status === 'uploading' || status === 'paused') && (
            <div className="flex gap-2 mb-4">
              {status === 'uploading' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    pauseUpload();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  Pause
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resumeUpload();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Resume
                </button>
              )}
            </div>
          )}
          
          {uploadedPath && (
            <div className="w-full p-3 bg-green-400/10 border border-green-400/20 rounded-lg mb-4">
              <p className="text-xs text-green-400 break-all">
                <strong>Upload complete:</strong> {uploadedPath}
              </p>
            </div>
          )}
          
          <div className="text-xs text-gray-500">
            <p>• Resumable uploads for large files (multi-GB)</p>
            <p>• 6MB chunks with automatic retry</p>
            <p>• Can pause and resume uploads</p>
          </div>
        </div>
      </div>
    </div>
  );
}

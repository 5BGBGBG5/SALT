"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, File, CheckCircle, AlertCircle, X, Loader2, Cloud } from 'lucide-react';
import ProtectedRoute from '../components/ProtectedRoute';

interface UploadFile {
  file: File;
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const ACCEPTED_FILE_TYPES = {
  'text/plain': ['.txt'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    const isValidType = Object.keys(ACCEPTED_FILE_TYPES).includes(file.type) ||
                       Object.values(ACCEPTED_FILE_TYPES).flat().some(ext => 
                         file.name.toLowerCase().endsWith(ext)
                       );
    
    if (!isValidType) {
      return 'File type not supported. Please upload .txt, .pdf, .doc, or .docx files.';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 10MB.';
    }

    return null;
  };

  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') return File;
    if (file.type.includes('word') || file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) return FileText;
    return FileText;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const addFiles = useCallback((newFiles: File[]) => {
    const validFiles: UploadFile[] = [];
    
    newFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        setMessage({ type: 'error', text: error });
        return;
      }

      // Check for duplicates
      const isDuplicate = files.some(f => f.file.name === file.name && f.file.size === file.size);
      if (isDuplicate) {
        setMessage({ type: 'error', text: `File "${file.name}" is already added.` });
        return;
      }

      validFiles.push({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: 'pending',
        progress: 0,
      });
    });

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setMessage(null);
    }
  }, [files]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    addFiles(selectedFiles);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('filename', uploadFile.file.name);
    formData.append('filesize', uploadFile.file.size.toString());
    formData.append('filetype', uploadFile.file.type);

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      const response = await fetch('https://inecta.app.n8n.cloud/webhook/upload-knowledge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      await response.json();
      
      // Update status to success
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success', progress: 100 }
          : f
      ));

    } catch (error) {
      // Update status to error
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              progress: 0,
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          : f
      ));
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      setMessage({ type: 'error', text: 'No files to upload.' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      // Upload files sequentially to avoid overwhelming the server
      for (const file of pendingFiles) {
        await uploadFile(file);
      }
      
      setMessage({ type: 'success', text: `Successfully uploaded ${pendingFiles.length} file(s) to the knowledge base.` });
    } catch {
      setMessage({ type: 'error', text: 'Some uploads failed. Please check individual file statuses.' });
    } finally {
      setIsUploading(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setMessage(null);
  };

  const pendingFiles = files.filter(f => f.status === 'pending');
  const uploadedFiles = files.filter(f => f.status === 'success');
  const failedFiles = files.filter(f => f.status === 'error');

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
          className="w-full max-w-4xl mx-auto relative z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-teal-200 to-emerald-200 bg-clip-text text-transparent mb-4">
              Knowledge Base Upload
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Upload documents to enhance the Inecta Intelligence knowledge base for better competitive insights
            </p>
          </motion.div>

          {/* Upload card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="glass-card p-8 mb-6"
          >
            {/* Drag and drop area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
                isDragOver 
                  ? 'border-teal-400 bg-teal-400/10 scale-105' 
                  : 'border-gray-600 hover:border-teal-500 hover:bg-teal-500/5'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="text-center">
                <motion.div
                  animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Cloud className="w-16 h-16 text-teal-400 mx-auto mb-4" />
                </motion.div>
                
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isDragOver ? 'Drop files here' : 'Drag & drop files or click to browse'}
                </h3>
                <p className="text-gray-400 mb-4">
                  Supports .txt, .pdf, .doc, and .docx files up to 10MB each
                </p>
                
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary inline-flex items-center space-x-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose Files</span>
                </motion.button>
              </div>
            </div>

            {/* File list */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">
                      Selected Files ({files.length})
                    </h4>
                    <div className="flex space-x-2">
                      {pendingFiles.length > 0 && (
                        <motion.button
                          onClick={handleUploadAll}
                          disabled={isUploading}
                          className="btn-primary text-sm px-4 py-2 inline-flex items-center space-x-2"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Upload All</span>
                            </>
                          )}
                        </motion.button>
                      )}
                      <motion.button
                        onClick={clearAll}
                        className="btn-secondary text-sm px-4 py-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Clear All
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {files.map((uploadFile) => {
                      const Icon = getFileIcon(uploadFile.file);
                      return (
                        <motion.div
                          key={uploadFile.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <Icon className="w-6 h-6 text-teal-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-medium truncate">
                                {uploadFile.file.name}
                              </p>
                              <p className="text-gray-400 text-sm">
                                {formatFileSize(uploadFile.file.size)}
                              </p>
                              {uploadFile.error && (
                                <p className="text-red-400 text-sm mt-1">
                                  {uploadFile.error}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            {/* Status indicator */}
                            {uploadFile.status === 'pending' && (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>
                            )}
                            {uploadFile.status === 'uploading' && (
                              <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
                            )}
                            {uploadFile.status === 'success' && (
                              <CheckCircle className="w-6 h-6 text-green-400" />
                            )}
                            {uploadFile.status === 'error' && (
                              <AlertCircle className="w-6 h-6 text-red-400" />
                            )}

                            {/* Remove button */}
                            <motion.button
                              onClick={() => removeFile(uploadFile.id)}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <X className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Upload summary */}
                  {(uploadedFiles.length > 0 || failedFiles.length > 0) && (
                    <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{files.length}</div>
                          <div className="text-gray-400 text-sm">Total Files</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-400">{uploadedFiles.length}</div>
                          <div className="text-gray-400 text-sm">Uploaded</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-400">{failedFiles.length}</div>
                          <div className="text-gray-400 text-sm">Failed</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`mt-6 p-4 rounded-lg flex items-center space-x-3 ${
                    message.type === 'success' 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                      : 'bg-red-500/20 border border-red-500/30 text-red-400'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <p>{message.text}</p>
                  <motion.button
                    onClick={() => setMessage(null)}
                    className="ml-auto text-current hover:opacity-70 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}

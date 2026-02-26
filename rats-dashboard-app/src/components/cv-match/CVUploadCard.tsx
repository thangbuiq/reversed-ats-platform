'use client';
import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Button from '@/components/ui/button/Button';

interface CVUploadCardProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export default function CVUploadCard({ onUpload, isUploading }: CVUploadCardProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Upload Your CV</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Upload a PDF or text file to find best matching jobs
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all ${
          isDragActive
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10'
            : selectedFile
              ? 'border-success-300 bg-success-50/30 dark:border-success-500/40 dark:bg-success-500/5'
              : 'hover:border-brand-300 dark:hover:border-brand-500/50 border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.02]'
        } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />

        {/* Upload icon */}
        <div
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            selectedFile ? 'bg-success-100 dark:bg-success-500/20' : 'bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {selectedFile ? (
            <svg
              className="text-success-500 h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="h-8 w-8 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          )}
        </div>

        {selectedFile ? (
          <div className="z-10 flex w-full flex-col items-center text-center">
            <p className="font-medium text-gray-800 dark:text-white/90">{selectedFile.name}</p>
            <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
              {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop to replace
            </p>
            {previewUrl &&
              (selectedFile.type === 'application/pdf' ? (
                <div className="pointer-events-auto mt-2 flex h-[200px] w-full max-w-lg flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <svg
                    className="text-error-400 dark:text-error-500 mb-3 h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                  <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    PDF ready for matching
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(previewUrl, '_blank');
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Open preview
                  </button>
                </div>
              ) : (
                <div className="pointer-events-auto mt-2 h-[400px] w-full max-w-lg overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800">
                  <iframe
                    src={previewUrl}
                    className="h-full w-full rounded-md bg-white shadow-sm dark:bg-white"
                    title="CV Preview"
                  />
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center">
            <p className="font-medium text-gray-700 dark:text-gray-300">
              {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV here'}
            </p>
            <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
              or click to browse • PDF, TXT supported
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          size="md"
          variant="primary"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Matching…
            </span>
          ) : (
            'Find Matching Jobs'
          )}
        </Button>
      </div>
    </div>
  );
}

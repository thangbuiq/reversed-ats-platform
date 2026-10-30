'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Check, Loader2, Upload } from 'lucide-react';
import Button from '@/components/ui/button/Button';

interface CVUploadBarProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

/** Slim one-row CV picker: an inline drop zone plus the match button. */
export default function CVUploadBar({ onUpload, isUploading }: CVUploadBarProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setSelectedFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const tone = isDragActive
    ? 'border-brand-500 bg-brand-50'
    : selectedFile
      ? 'border-success-300 bg-success-50/50'
      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50';

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
      <div
        {...getRootProps()}
        className={`flex h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 text-sm sm:h-11 transition-colors ${tone} ${
          isUploading ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        <input {...getInputProps()} />
        {selectedFile ? (
          <Check className="text-success-500 shrink-0" size={16} strokeWidth={2.5} />
        ) : (
          <Upload className="shrink-0 text-gray-400" size={16} strokeWidth={1.75} />
        )}
        <span className="min-w-0 flex-1 truncate text-gray-700">
          {selectedFile ? (
            selectedFile.name
          ) : isDragActive ? (
            'Drop your CV here'
          ) : (
            <>
              <span className="sm:hidden">Tap to choose your CV</span>
              <span className="hidden sm:inline">Drop your CV or click to browse</span>
            </>
          )}
        </span>
        <span className="label-md shrink-0 text-gray-400">
          {selectedFile ? `${(selectedFile.size / 1024).toFixed(0)} KB` : 'PDF · TXT'}
        </span>
      </div>
      <Button
        onClick={() => selectedFile && onUpload(selectedFile)}
        disabled={!selectedFile || isUploading}
        size="md"
        variant="primary"
        className="w-full sm:w-auto"
      >
        {isUploading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin" size={16} />
            Matching…
          </span>
        ) : (
          'Find matches'
        )}
      </Button>
    </div>
  );
}

'use client';
import React, { useCallback, useState } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Check, FileUp, Loader2, Sparkles } from 'lucide-react';

/** Vercel rejects request bodies above ~4.5 MB, so larger CVs never reach the API. */
const MAX_CV_BYTES = 4 * 1024 * 1024;

interface CVUploadBarProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function rejectionMessage([rejection]: FileRejection[]): string {
  const code = rejection?.errors[0]?.code;
  if (code === 'file-too-large') return 'This file is over 4 MB. Upload a smaller CV.';
  if (code === 'file-invalid-type') return 'Only PDF, TXT or Markdown CVs are supported.';
  if (code === 'too-many-files') return 'Drop one CV at a time.';
  return 'This file cannot be used. Try another CV.';
}

/** CV picker: choosing or dropping a file starts matching straight away. */
export default function CVUploadBar({ onUpload, isUploading }: CVUploadBarProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) {
        setRejection(rejectionMessage(rejected));
        return;
      }
      if (accepted.length === 0) return;
      setRejection(null);
      setSelectedFile(accepted[0]);
      onUpload(accepted[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    maxSize: MAX_CV_BYTES,
    multiple: false,
    noClick: true,
    disabled: isUploading,
  });

  const tone = isDragActive
    ? 'border-brand-500 bg-brand-50 scale-[1.01]'
    : selectedFile
      ? 'border-success-500/60 bg-success-50/60'
      : 'border-gray-300 bg-white/70 hover:border-gray-900';

  return (
    <div className="space-y-2">
      <div
        {...getRootProps({ onClick: open })}
        role="button"
        aria-label="Choose a CV to match"
        className={`group flex min-h-16 w-full cursor-pointer items-center gap-3 border border-dashed px-4 py-3 backdrop-blur-sm transition-[transform,background-color,border-color] duration-300 ease-out sm:px-5 ${tone} ${
          isUploading ? 'pointer-events-none' : ''
        }`}
      >
        <input {...getInputProps()} />
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center text-white transition-colors ${
            selectedFile && !isUploading ? 'bg-success-500' : 'bg-black group-hover:bg-gray-800'
          }`}
        >
          {isUploading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : selectedFile ? (
            <Check size={18} strokeWidth={2.5} />
          ) : (
            <FileUp size={18} strokeWidth={1.75} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-gray-900">
            {isDragActive
              ? 'Drop your CV here'
              : isUploading
                ? 'Reading your CV and ranking jobs…'
                : selectedFile
                  ? selectedFile.name
                  : 'Upload your CV'}
          </span>
          <span className="label-md mt-1 block truncate text-gray-500">
            {selectedFile
              ? `${formatSize(selectedFile.size)} · ${isUploading ? 'matching' : 'tap to replace'}`
              : 'PDF · TXT · MD — up to 4 MB'}
          </span>
        </span>
        <span className="btn-accent label-md hidden h-10 shrink-0 px-4 sm:inline-flex">
          <Sparkles size={14} />
          {selectedFile ? 'Replace' : 'Browse'}
        </span>
      </div>

      {rejection && (
        <p role="alert" className="text-brand-600 text-xs">
          {rejection}
        </p>
      )}
    </div>
  );
}

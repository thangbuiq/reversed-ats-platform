"use client";
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Button from "@/components/ui/button/Button";

interface CVUploadCardProps {
    onUpload: (file: File) => void;
    isUploading: boolean;
}

export default function CVUploadCard({
    onUpload,
    isUploading,
}: CVUploadCardProps) {
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
            "application/pdf": [".pdf"],
            "text/plain": [".txt"],
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
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] md:p-8">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Upload Your CV
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Upload a PDF or text file to find best matching jobs
                </p>
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer ${isDragActive
                    ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                    : selectedFile
                        ? "border-success-300 bg-success-50/30 dark:border-success-500/40 dark:bg-success-500/5"
                        : "border-gray-300 hover:border-brand-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-brand-500/50 dark:hover:bg-white/[0.02]"
                    } ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
            >
                <input {...getInputProps()} />

                {/* Upload icon */}
                <div
                    className={`mb-4 flex items-center justify-center w-16 h-16 rounded-full ${selectedFile
                        ? "bg-success-100 dark:bg-success-500/20"
                        : "bg-gray-100 dark:bg-gray-800"
                        }`}
                >
                    {selectedFile ? (
                        <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                    )}
                </div>

                {selectedFile ? (
                    <div className="w-full text-center flex flex-col items-center z-10">
                        <p className="font-medium text-gray-800 dark:text-white/90">
                            {selectedFile.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
                            {(selectedFile.size / 1024).toFixed(1)} KB • Click or drop to
                            replace
                        </p>
                        {previewUrl && (
                            <div className="w-full max-w-lg h-[400px] mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2 pointer-events-auto">
                                {selectedFile.type === "application/pdf" ? (
                                    <object data={previewUrl} type="application/pdf" className="w-full h-full rounded-md shadow-sm">
                                        <p className="p-4 text-sm text-gray-500">PDF preview not available. Please view your local file.</p>
                                    </object>
                                ) : (
                                    <iframe src={previewUrl} className="w-full h-full bg-white dark:bg-white rounded-md shadow-sm" title="CV Preview" />
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                            {isDragActive ? "Drop your CV here" : "Drag & drop your CV here"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
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
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Matching…
                        </span>
                    ) : (
                        "Find Matching Jobs"
                    )}
                </Button>
            </div>
        </div>
    );
}

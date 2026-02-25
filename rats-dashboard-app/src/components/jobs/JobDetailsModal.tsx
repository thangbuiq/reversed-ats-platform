import React, { useEffect } from "react";
import Markdown from "react-markdown";
import Badge from "@/components/ui/badge/Badge";
import { freshnessInfo } from "@/lib/freshness";

export interface JobDetailsModalProps {
    job: {
        job_title: string | null;
        company_name: string | null;
        location: string | null;
        job_url: string | null;
        payload: Record<string, unknown>;
    } | null;
    onClose: () => void;
}

export default function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (job) {
            document.addEventListener("keydown", handleEsc);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleEsc);
            document.body.style.overflow = "unset";
        };
    }, [job, onClose]);

    if (!job) return null;

    const getPayloadField = (key: string): string => {
        const val = job.payload?.[key];
        if (val === null || val === undefined || val === "") return "—";
        return String(val);
    };

    return (
        <div className="fixed inset-0 z-[99999]" role="dialog" aria-modal="true">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Content Frame (Shadcn Radix Dialog alike) */}
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white p-6 shadow-lg sm:rounded-xl dark:border-gray-800 dark:bg-gray-900 animate-in zoom-in-95 fade-in">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 focus:outline-none focus:ring-2 disabled:pointer-events-none"
                    aria-label="Close dialog"
                >
                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="flex flex-col space-y-1.5 text-center sm:text-left pr-8">
                    <h2 className="text-xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
                        {job.job_title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {job.company_name}{job.location ? ` · ${job.location}` : ""}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-2">
                        {getPayloadField("job_level") !== "—" && (
                            <Badge size="sm" color="info">{getPayloadField("job_level")}</Badge>
                        )}
                        {getPayloadField("job_type") !== "—" && (
                            <Badge size="sm" color="light">{getPayloadField("job_type")}</Badge>
                        )}
                        {getPayloadField("date_posted") !== "—" && (() => {
                            const fi = freshnessInfo(getPayloadField("date_posted"));
                            return (
                                <Badge size="sm" color={fi.color}>
                                    {fi.isEarlyBird ? `🐣 ${fi.label}` : fi.label}
                                </Badge>
                            );
                        })()}
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar my-2">
                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 [&>p]:mb-4 [&>ul]:mb-4 [&>ol]:mb-4 [&>h1]:mt-6 [&>h2]:mt-5 [&>h3]:mt-4 [&>li]:mb-2 leading-8">
                        <Markdown>
                            {getPayloadField("job_description") !== "—"
                                ? getPayloadField("job_description")
                                : "*No description available.*"}
                        </Markdown>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-2">
                    <button
                        onClick={onClose}
                        className="mt-3 sm:mt-0 inline-flex w-full sm:w-auto items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors dark:border-gray-700 dark:hover:bg-gray-800 dark:text-gray-300"
                    >
                        Close
                    </button>
                    {job.job_url && (
                        <a
                            href={job.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                        >
                            Apply Now
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}

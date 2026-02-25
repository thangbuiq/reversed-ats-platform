"use client";
import React from "react";
import Badge from "@/components/ui/badge/Badge";
import { ArrowUpIcon, BoxIconLine, GroupIcon } from "@/icons";

interface JobsMetricsProps {
    totalJobs: number;
    latestDate: string | null;
    topCompanies: number;
}

export default function JobsMetrics({
    totalJobs,
    latestDate,
    topCompanies,
}: JobsMetricsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
            {/* Total Jobs */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/15">
                            <BoxIconLine className="text-brand-500 w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Jobs</span>
                            <Badge color="primary">
                                <ArrowUpIcon />
                                Active
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <h4 className="font-semibold text-gray-800 text-xl dark:text-white/90">
                            {totalJobs.toLocaleString()}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Latest Posting */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/15">
                            <svg className="text-success-500 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Latest Posting</span>
                            <Badge color="success">Recent</Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <h4 className="font-semibold text-gray-800 text-lg dark:text-white/90">
                            {latestDate ?? "N/A"}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Unique Companies */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex shrink-0 items-center justify-center w-10 h-10 rounded-lg bg-warning-50 dark:bg-warning-500/15">
                            <GroupIcon className="text-warning-500 w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Unique Companies</span>
                            <Badge color="warning">Diverse</Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <h4 className="font-semibold text-gray-800 text-xl dark:text-white/90">
                            {topCompanies.toLocaleString()}
                        </h4>
                    </div>
                </div>
            </div>
        </div>
    );
}

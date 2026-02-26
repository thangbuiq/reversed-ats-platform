import type { JobMatch } from "@/types/api";

/** Days threshold to consider a job "early bird" / fresh */
export const EARLY_BIRD_DAYS = 3;
export const FRESH_DAYS = 7;

/**
 * Compute days since a job was posted.
 * Returns NaN if date is invalid/missing.
 */
export function daysSincePosted(dateStr: string | null | undefined): number {
    if (!dateStr) return NaN;
    const diff = Math.floor((Date.now() - new Date(String(dateStr)).getTime()) / 86_400_000);
    return diff;
}

export function freshnessInfo(dateStr: string | null | undefined): {
    label: string;
    color: "success" | "error" | "warning" | "info" | "light";
    isEarlyBird: boolean;
} {
    const days = daysSincePosted(dateStr);
    if (isNaN(days)) return { label: "Reposted", color: "info", isEarlyBird: false };
    if (days <= EARLY_BIRD_DAYS) return { label: `${days}d ago`, color: "success", isEarlyBird: true };
    if (days <= FRESH_DAYS) return { label: `${days}d ago`, color: "success", isEarlyBird: false };
    return { label: `${days}d ago`, color: "error", isEarlyBird: false };
}

/**
 * Apply a min-max normalization with power scaling to spread clustered scores.
 *
 * Raw cosine similarity scores from bge-small-en-v1.5 tend to cluster around
 * 0.70-0.80. This function:
 * 1. Min-max normalizes across the result set → [0, 1]
 * 2. Applies power curve (sqrt) to boost top scores
 * 3. Maps to a display range of [MIN_DISPLAY, MAX_DISPLAY]
 *
 * Result: the best match shows ~95%+ and worst ~50-60%, with clear gaps.
 */
const MIN_DISPLAY = 0.75;
const MAX_DISPLAY = 0.98;

export function spreadScores(matches: JobMatch[]): JobMatch[] {
    if (matches.length === 0) return matches;
    if (matches.length === 1) {
        return [{ ...matches[0], score: MAX_DISPLAY }];
    }

    const scores = matches.map((m) => m.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore;

    return matches.map((match) => {
        // Normalize to [0, 1]
        const normalized = range > 0.001 ? (match.score - minScore) / range : 1;
        // Power curve: sqrt exaggerates differences for top scores
        const curved = Math.sqrt(normalized);
        // Map to display range
        const displayScore = MIN_DISPLAY + curved * (MAX_DISPLAY - MIN_DISPLAY);
        return { ...match, score: displayScore };
    });
}

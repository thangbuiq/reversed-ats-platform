const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

export type Trend = 'up' | 'down' | 'flat';

export interface TooltipHeadline {
  label: string;
  value: string;
  trend?: Trend;
}

export type TooltipRow = [label: string, value: string, trend?: Trend];

export interface BreakdownItem {
  label: string;
  value: number;
  color: string;
}

export interface TooltipBreakdown {
  title: string;
  items: BreakdownItem[];
}

function renderBreakdown({ title, items }: TooltipBreakdown): string {
  if (items.length === 0) return '';
  const max = Math.max(...items.map((i) => i.value));
  const bars = items
    .map(
      ({ label, value, color }) =>
        `<div class="flex items-center gap-2 text-[10px] leading-3"><span class="w-20 shrink-0 truncate text-gray-500">${escapeHtml(label)}</span><span class="h-1 flex-1  bg-gray-100"><span class="block h-1 " style="width:${Math.max((value / max) * 100, 4)}%;background:${color}"></span></span><span class="w-5 shrink-0 text-right font-mono text-gray-800">${value}</span></div>`
    )
    .join('');
  return `<div class="space-y-1 border-t border-gray-100 pt-2"><div class="label-md text-[10px] text-gray-500">${escapeHtml(title)}</div>${bars}</div>`;
}

const TREND_PATHS: Record<Trend, string> = {
  up: 'M5 1.5 9 8.5H1Z',
  down: 'M5 8.5 1 1.5h8Z',
  flat: 'M1 4h8v2H1Z',
};

const TREND_ICON_TONE: Record<Trend, string> = {
  up: 'text-success-500',
  down: 'text-brand-500',
  flat: 'text-gray-400',
};

const TREND_TEXT_TONE: Record<Trend, string> = {
  up: 'text-success-700',
  down: 'text-brand-500',
  flat: 'text-gray-800',
};

function trendIcon(trend: Trend): string {
  return `<svg class="${TREND_ICON_TONE[trend]} mr-1 inline-block h-2.5 w-2.5 shrink-0" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="${TREND_PATHS[trend]}"/></svg>`;
}

/**
 * Builds the markup for an ApexCharts custom tooltip: a title, a red headline figure and
 * label/value rows. Pair with the transparent `.apexcharts-tooltip` rule so this is the only layer.
 */
export function renderTooltip(
  title: string,
  headline: TooltipHeadline,
  rows: TooltipRow[],
  breakdown?: TooltipBreakdown
): string {
  const headlineTrend = headline.trend ? trendIcon(headline.trend) : '';
  const body = rows
    .map(
      ([label, value, trend]) =>
        `<div class="flex items-center justify-between gap-6 text-xs"><span class="text-gray-500">${escapeHtml(label)}</span><span class="font-mono font-semibold ${trend ? TREND_TEXT_TONE[trend] : 'text-gray-800'}">${trend ? trendIcon(trend) : ''}${escapeHtml(value)}</span></div>`
    )
    .join('');
  return `<div class="min-w-[200px] max-w-[280px] space-y-2  border border-gray-200 bg-white px-3 py-2.5"><div class="label-md text-gray-500">${escapeHtml(title)}</div><div class="flex items-baseline gap-2"><span class="text-brand-500 font-display flex items-center text-2xl leading-none font-medium">${headlineTrend}${escapeHtml(headline.value)}</span><span class="text-xs text-gray-500">${escapeHtml(headline.label)}</span></div><div class="space-y-1.5 border-t border-gray-100 pt-2">${body}</div>${breakdown ? renderBreakdown(breakdown) : ''}</div>`;
}

const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const RECENT_THRESHOLD_MS = 7 * DAY_MS;

function toDate(value: string | Date): Date {
    return value instanceof Date ? value : new Date(value);
}

function formatAbsoluteDate(date: Date): string {
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Formats a post's creation date as a relative time ("just now", "5m", "3h",
 * "2d") when recent, falling back to an absolute short date ("12 Mar 2026")
 * once the post is older than ~7 days.
 *
 * Accepts an optional `now` so callers (and tests) can pin the clock.
 * Returns an empty string when `value` is not a valid date.
 */
export function formatPostDate(
    value: string | Date,
    now: Date = new Date(),
): string {
    const date = toDate(value);

    if (Number.isNaN(date.getTime()) || Number.isNaN(now.getTime())) {
        return '';
    }

    const diffMs = Math.max(0, now.getTime() - date.getTime());

    if (diffMs < MINUTE_MS) {
        return 'just now';
    }

    if (diffMs < HOUR_MS) {
        return `${Math.floor(diffMs / MINUTE_MS)}m`;
    }

    if (diffMs < DAY_MS) {
        return `${Math.floor(diffMs / HOUR_MS)}h`;
    }

    if (diffMs < RECENT_THRESHOLD_MS) {
        return `${Math.floor(diffMs / DAY_MS)}d`;
    }

    return formatAbsoluteDate(date);
}

function formatCompact(value: number, divisor: number, suffix: string): string {
    const rounded = Math.round((value / divisor) * 10) / 10;
    const isWhole = Number.isInteger(rounded);

    return `${isWhole ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`;
}

/**
 * Formats a count compactly: 999 -> "999", 1000 -> "1K", 1500 -> "1.5K",
 * 1000000 -> "1M". Negative input is clamped to 0.
 */
export function formatCount(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
        return '0';
    }

    if (value >= 1_000_000) {
        return formatCompact(value, 1_000_000, 'M');
    }

    // Rounding can push a value over the next unit (999,999 would otherwise
    // render as "1000K"), so promote it rather than printing four digits.
    if (value >= 999_950) {
        return formatCompact(value, 1_000_000, 'M');
    }

    if (value >= 1_000) {
        return formatCompact(value, 1_000, 'K');
    }

    return String(Math.floor(value));
}

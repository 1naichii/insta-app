import { formatCount, formatPostDate } from '@/lib/format';

describe('formatPostDate', () => {
    const now = new Date('2026-07-30T12:00:00Z');

    it.each([
        ['2026-07-30T11:59:30Z', 'just now'],
        ['2026-07-30T11:55:00Z', '5m'],
        ['2026-07-30T09:00:00Z', '3h'],
        ['2026-07-28T12:00:00Z', '2d'],
        ['2026-07-20T12:00:00Z', '20 Jul 2026'],
        ['invalid', ''],
    ])('formats %s as %s', (value, expected) => {
        expect(formatPostDate(value, now)).toBe(expected);
    });
});

describe('formatCount', () => {
    it.each([
        [0, '0'],
        [999, '999'],
        [1000, '1K'],
        [1500, '1.5K'],
        [1_000_000, '1M'],
        [-1, '0'],
        [999_999, '1M'],
    ])('formats %d as %s', (value, expected) => {
        expect(formatCount(value)).toBe(expected);
    });
});

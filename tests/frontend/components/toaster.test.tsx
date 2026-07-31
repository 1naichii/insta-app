import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';

const viewport = vi.hoisted(() => ({ isMobile: false }));

vi.mock('sonner', () => ({
    Toaster: ({
        icons,
        position,
    }: {
        icons?: Record<string, ReactNode>;
        position?: string;
    }) => (
        <div data-testid="toaster" data-position={position}>
            {Object.entries(icons ?? {}).map(([type, icon]) => (
                <span key={type} data-testid={`${type}-icon`}>
                    {icon}
                </span>
            ))}
        </div>
    ),
}));

vi.mock('@/hooks/use-appearance', () => ({
    useAppearance: () => ({ appearance: 'light' }),
}));

vi.mock('@/hooks/use-flash-toast', () => ({
    useFlashToast: vi.fn(),
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => viewport.isMobile,
}));

beforeEach(() => {
    viewport.isMobile = false;
});

it('places notifications at the bottom right on desktop', () => {
    render(<Toaster />);

    expect(screen.getByTestId('toaster')).toHaveAttribute(
        'data-position',
        'bottom-right',
    );
});

it('places notifications at the top center on mobile', () => {
    viewport.isMobile = true;

    render(<Toaster />);

    expect(screen.getByTestId('toaster')).toHaveAttribute(
        'data-position',
        'top-center',
    );
});

it.each([
    ['success', 'text-green-600'],
    ['info', 'text-blue-600'],
    ['warning', 'text-amber-600'],
    ['error', 'text-red-600'],
    ['loading', 'text-muted-foreground'],
])('uses a semantic color for the %s icon', (type, color) => {
    render(<Toaster />);

    expect(screen.getByTestId(`${type}-icon`).querySelector('svg')).toHaveClass(
        color,
    );
});

import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import AppNavDock from '@/components/app-nav-dock';
import AppNavRail from '@/components/app-nav-rail';

const page = vi.hoisted(() => ({
    url: '/feed',
    props: {
        auth: {
            user: {
                id: 2,
                name: 'Ada Lovelace',
                email: 'ada@example.test',
                username: 'ada',
                avatar_url: null,
                email_verified_at: '2026-07-30T09:00:00Z',
                created_at: '2026-07-30T09:00:00Z',
                updated_at: '2026-07-30T09:00:00Z',
                two_factor_enabled: false,
            },
        },
    },
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        href,
        ...props
    }: Omit<ComponentProps<'a'>, 'href'> & {
        children: ReactNode;
        href: string | { url: string };
    }) => (
        <a href={typeof href === 'string' ? href : href.url} {...props}>
            {children}
        </a>
    ),
    usePage: () => page,
}));

describe.each([
    ['navigation rail', AppNavRail],
    ['navigation dock', AppNavDock],
])('%s', (_, Navigation) => {
    it('renders the main destinations, active item, and named account trigger', () => {
        page.url = '/feed';
        render(<Navigation />);

        expect(screen.getByRole('link', { name: 'Feed' })).toHaveAttribute(
            'href',
            '/feed',
        );
        expect(screen.getByRole('link', { name: 'Create' })).toHaveAttribute(
            'href',
            '/posts/create',
        );
        expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
            'href',
            '/@ada',
        );
        expect(screen.getByRole('link', { name: 'Feed' })).toHaveAttribute(
            'aria-current',
            'page',
        );
        expect(
            screen.getByRole('button', { name: 'Ada Lovelace' }),
        ).toBeInTheDocument();
    });
});

describe('AppNavRail', () => {
    it('renders the settings destination and marks it active', () => {
        page.url = '/settings/profile';
        render(<AppNavRail />);

        expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
            'href',
            '/settings/profile',
        );
        expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
            'aria-current',
            'page',
        );
    });
});

import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { SettingsNav } from '@/components/settings-nav';

const page = vi.hoisted(() => ({
    url: '/settings/security',
    props: {},
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

it('renders the settings destinations and marks the current section active', () => {
    render(<SettingsNav />);

    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
        'href',
        '/settings/profile',
    );
    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute(
        'href',
        '/settings/security',
    );
    expect(screen.getByRole('link', { name: 'Appearance' })).toHaveAttribute(
        'href',
        '/settings/appearance',
    );
    expect(screen.getByRole('link', { name: 'Security' })).toHaveClass(
        'bg-muted',
        'text-foreground',
    );
});

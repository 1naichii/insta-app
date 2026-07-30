import { render, screen } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import SettingsLayout from '@/layouts/settings/layout';

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
    usePage: () => ({ url: '/settings/profile', props: {} }),
}));

it('renders section content with desktop navigation and a mobile back control', () => {
    render(
        <SettingsLayout>
            <p>Section content</p>
        </SettingsLayout>,
    );

    expect(screen.getByText('Section content')).toBeInTheDocument();
    expect(
        screen.getByRole('heading', { name: 'Settings' }),
    ).toBeInTheDocument();
    expect(
        screen.getByRole('link', { name: 'Back to settings' }),
    ).toHaveAttribute('href', '/settings');
    expect(
        screen.getByRole('navigation', { name: 'Settings' }),
    ).toBeInTheDocument();
});

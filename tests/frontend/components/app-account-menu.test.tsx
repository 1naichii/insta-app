import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import { AppAccountMenu } from '@/components/app-account-menu';
import type { User } from '@/types';

const viewport = vi.hoisted(() => ({ isMobile: false }));
const cleanup = vi.hoisted(() => vi.fn());
const page = vi.hoisted(() => ({
    props: {
        auth: {
            user: {
                id: 2,
                name: 'Ada Lovelace',
                email: 'ada@example.test',
                username: 'ada',
                bio: null,
                avatar_url: null,
                email_verified_at: '2026-07-30T09:00:00Z',
                created_at: '2026-07-30T09:00:00Z',
                updated_at: '2026-07-30T09:00:00Z',
            } as User | null,
        },
    },
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({
        as,
        children,
        href,
        prefetch,
        ...props
    }: Omit<ComponentProps<'a'>, 'href'> & {
        as?: string;
        children: ReactNode;
        href: string | { url: string };
        prefetch?: boolean;
    }) => {
        void prefetch;

        return as === 'button' ? (
            <button type="button" {...(props as ComponentProps<'button'>)}>
                {children}
            </button>
        ) : (
            <a href={typeof href === 'string' ? href : href.url} {...props}>
                {children}
            </a>
        );
    },
    router: { flushAll: vi.fn() },
    usePage: () => page,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuContent: ({
        align,
        children,
        side,
    }: {
        align?: string;
        children: ReactNode;
        side?: string;
    }) => (
        <div data-align={align} data-side={side}>
            {children}
        </div>
    ),
    DropdownMenuGroup: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuItem: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuLabel: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuTrigger: ({ children }: { children: ReactNode }) => (
        <>{children}</>
    ),
}));

vi.mock('@/components/ui/sheet', () => ({
    Sheet: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SheetContent: ({ children }: { children: ReactNode }) => (
        <div role="dialog" aria-label="Account">
            {children}
        </div>
    ),
    SheetDescription: ({ children }: { children: ReactNode }) => (
        <p>{children}</p>
    ),
    SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
    SheetTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/logout-confirmation-dialog', () => ({
    default: ({ open }: { open: boolean }) =>
        open ? (
            <div role="dialog" aria-label="Log out?">
                Confirm logout
            </div>
        ) : null,
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => viewport.isMobile,
}));

vi.mock('@/hooks/use-mobile-navigation', () => ({
    useMobileNavigation: () => cleanup,
}));

beforeEach(() => {
    viewport.isMobile = false;
    cleanup.mockReset();
    page.props.auth.user = {
        id: 2,
        name: 'Ada Lovelace',
        email: 'ada@example.test',
        username: 'ada',
        bio: null,
        avatar_url: null,
        email_verified_at: '2026-07-30T09:00:00Z',
        created_at: '2026-07-30T09:00:00Z',
        updated_at: '2026-07-30T09:00:00Z',
    };
});

it('renders the desktop trigger named by the display name', () => {
    render(<AppAccountMenu />);

    expect(
        screen.getByRole('button', { name: 'Ada Lovelace' }),
    ).toBeInTheDocument();
});

it('places the desktop account menu above the trigger', () => {
    const { container } = render(<AppAccountMenu />);

    expect(container.querySelector('[data-side]')).toHaveAttribute(
        'data-side',
        'top',
    );
    expect(container.querySelector('[data-align]')).toHaveAttribute(
        'data-align',
        'start',
    );
});

it('opens mobile account actions with settings and logout', async () => {
    const user = userEvent.setup();
    viewport.isMobile = true;

    render(<AppAccountMenu />);
    await user.click(screen.getByRole('button', { name: 'Ada Lovelace' }));

    expect(screen.getByRole('dialog', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
        'href',
        '/settings',
    );
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
});

it('asks for confirmation before logging out on desktop', async () => {
    const user = userEvent.setup();
    render(<AppAccountMenu />);

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(
        screen.getByRole('dialog', { name: 'Log out?' }),
    ).toBeInTheDocument();
});

it('asks for confirmation before logging out on mobile', async () => {
    const user = userEvent.setup();
    viewport.isMobile = true;
    render(<AppAccountMenu />);

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(cleanup).toHaveBeenCalledOnce();
    expect(
        screen.getByRole('dialog', { name: 'Log out?' }),
    ).toBeInTheDocument();
});

it('renders nothing without an authenticated user', () => {
    page.props.auth.user = null;

    const { container } = render(<AppAccountMenu />);

    expect(container).toBeEmptyDOMElement();
});

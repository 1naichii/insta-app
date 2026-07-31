import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import { vi } from 'vitest';
import PasskeyRegistration from '@/components/passkey-register';
import Register from '@/pages/auth/register';
import Profile from '@/pages/settings/profile';

const formState = vi.hoisted(() => ({
    processing: false,
    errors: {} as Record<string, string>,
}));

const authState = vi.hoisted(() => ({
    auth: {
        user: {
            name: 'Test User',
            username: 'testuser',
            email: 'test@example.com',
            bio: null,
            avatar_url: null,
            email_verified_at: null,
        },
    },
}));

const passkeyState = vi.hoisted(() => ({
    isLoading: false,
    error: null as string | null,
    isSupported: true,
}));

vi.mock('@inertiajs/react', () => ({
    Form: ({
        children,
        ...props
    }: {
        children: (state: typeof formState) => ReactNode;
    }) => <form {...props}>{children(formState)}</form>,
    Head: () => null,
    Link: ({ children, href, ...props }: ComponentProps<'a'>) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
    usePage: () => ({ props: authState }),
}));

vi.mock('@/actions/App/Http/Controllers/Settings/ProfileController', () => ({
    default: {
        update: {
            form: () => ({}),
        },
    },
}));

vi.mock('@/components/delete-user', () => ({ default: () => null }));
vi.mock('@/components/heading', () => ({ default: () => null }));
vi.mock('@/components/image-upload', () => ({
    default: () => <input aria-label="Profile photo" />,
}));

vi.mock('@laravel/passkeys/react', () => ({
    usePasskeyRegister: () => ({
        register: vi.fn(),
        ...passkeyState,
    }),
}));

beforeEach(() => {
    formState.processing = false;
    formState.errors = {};
    passkeyState.isLoading = false;
    passkeyState.error = null;
    passkeyState.isSupported = true;
});

describe('validation limits', () => {
    it('aligns registration field limits with backend validation', () => {
        render(<Register passwordRules="" />);

        expect(screen.getByLabelText('Name')).toHaveProperty('maxLength', 255);
        expect(screen.getByLabelText('Username')).toHaveProperty(
            'maxLength',
            50,
        );
        expect(screen.getByLabelText('Email address')).toHaveProperty(
            'maxLength',
            255,
        );
    });

    it('aligns profile field limits with backend validation', () => {
        render(<Profile mustVerifyEmail={false} />);

        expect(screen.getByLabelText('Name')).toHaveProperty('maxLength', 255);
        expect(screen.getByLabelText('Username')).toHaveProperty(
            'maxLength',
            50,
        );
        expect(screen.getByLabelText('Email address')).toHaveProperty(
            'maxLength',
            255,
        );
    });

    it('limits passkey names to the persisted field length', async () => {
        const user = userEvent.setup();

        render(<PasskeyRegistration onSuccess={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: 'Add passkey' }));

        expect(screen.getByLabelText('Passkey name')).toHaveProperty(
            'maxLength',
            255,
        );
    });
});

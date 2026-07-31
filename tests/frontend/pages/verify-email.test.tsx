import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import VerifyEmail from '@/pages/auth/verify-email';

vi.mock('@inertiajs/react', () => ({
    Form: ({
        children,
    }: {
        children: (props: { processing: boolean }) => ReactNode;
    }) => <form>{children({ processing: false })}</form>,
    Head: () => null,
}));

vi.mock('@/components/logout-confirmation-dialog', () => ({
    default: ({ open }: { open: boolean }) =>
        open ? (
            <div role="dialog" aria-label="Log out?">
                Confirm logout
            </div>
        ) : null,
}));

it('asks for confirmation before logging out', async () => {
    const user = userEvent.setup();
    render(<VerifyEmail />);

    expect(
        screen.queryByRole('dialog', { name: 'Log out?' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(
        screen.getByRole('dialog', { name: 'Log out?' }),
    ).toBeInTheDocument();
});

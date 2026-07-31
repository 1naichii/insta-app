import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import LogoutConfirmationDialog from '@/components/logout-confirmation-dialog';

const cleanup = vi.hoisted(() => vi.fn());
const flushAll = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', () => ({
    Form: ({
        action,
        children,
        method,
    }: {
        action: string;
        children: (props: { processing: boolean }) => ReactNode;
        disableWhileProcessing?: boolean;
        method: string;
    }) => (
        <form
            action={action}
            method={method}
            onSubmit={(event) => event.preventDefault()}
        >
            {children({ processing: false })}
        </form>
    ),
    router: { flushAll },
}));

vi.mock('@/hooks/use-mobile-navigation', () => ({
    useMobileNavigation: () => cleanup,
}));

beforeEach(() => {
    cleanup.mockReset();
    flushAll.mockReset();
});

it('submits the Wayfinder logout form only after confirmation', async () => {
    const user = userEvent.setup();
    render(<LogoutConfirmationDialog open onOpenChange={vi.fn()} />);

    const form = screen
        .getByRole('button', { name: 'Log out' })
        .closest('form');
    expect(form).toHaveAttribute('action', '/logout');
    expect(form).toHaveAttribute('method', 'post');

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(cleanup).toHaveBeenCalledOnce();
    expect(flushAll).toHaveBeenCalledOnce();
});

it('closes without submitting when cancelled', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<LogoutConfirmationDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(cleanup).not.toHaveBeenCalled();
    expect(flushAll).not.toHaveBeenCalled();
});

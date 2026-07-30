import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeletePostDialog from '@/components/delete-post-dialog';

describe('DeletePostDialog', () => {
    it('is closed by default and opens from the delete trigger', async () => {
        const user = userEvent.setup();
        render(<DeletePostDialog onConfirm={vi.fn()} />);

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Delete post' }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Delete this post?')).toBeInTheDocument();
    });

    it('closes when cancelled', async () => {
        const user = userEvent.setup();
        render(<DeletePostDialog onConfirm={vi.fn()} />);

        await user.click(screen.getByRole('button', { name: 'Delete post' }));
        await user.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('invokes the confirm callback', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        render(<DeletePostDialog onConfirm={onConfirm} />);

        await user.click(screen.getByRole('button', { name: 'Delete post' }));
        await user.click(
            screen.getByRole('button', { name: 'Confirm delete' }),
        );

        expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('disables dialog actions while loading', async () => {
        const user = userEvent.setup();
        render(<DeletePostDialog onConfirm={vi.fn()} processing />);

        await user.click(screen.getByRole('button', { name: 'Delete post' }));

        expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Confirm delete' }),
        ).toBeDisabled();
    });
});

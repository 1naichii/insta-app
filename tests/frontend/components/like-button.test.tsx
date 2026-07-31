import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import LikeButton from '@/components/like-button';

describe('LikeButton', () => {
    it('renders the not-yet-liked state and count', () => {
        render(<LikeButton liked={false} likesCount={10} onToggle={vi.fn()} />);

        expect(
            screen.getByRole('button', { name: 'Like post' }),
        ).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('renders the already-liked state', () => {
        render(<LikeButton liked likesCount={11} onToggle={vi.fn()} />);

        expect(
            screen.getByRole('button', { name: 'Unlike post' }),
        ).toHaveAttribute('aria-pressed', 'true');
    });

    it('fires the toggle callback', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();
        render(
            <LikeButton liked={false} likesCount={10} onToggle={onToggle} />,
        );

        await user.click(screen.getByRole('button', { name: 'Like post' }));

        expect(onToggle).toHaveBeenCalledOnce();
    });

    it('is disabled while loading', () => {
        render(
            <LikeButton
                liked={false}
                likesCount={10}
                onToggle={vi.fn()}
                processing
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Like post' }),
        ).toBeDisabled();
    });

    it('prevents a second click once a request is in flight', async () => {
        const user = userEvent.setup();
        const onToggle = vi.fn();

        function RequestHarness() {
            const [processing, setProcessing] = useState(false);

            return (
                <LikeButton
                    liked={false}
                    likesCount={10}
                    processing={processing}
                    onToggle={() => {
                        onToggle();
                        setProcessing(true);
                    }}
                />
            );
        }

        render(<RequestHarness />);
        const button = screen.getByRole('button', { name: 'Like post' });

        await user.click(button);
        await user.click(button);

        expect(onToggle).toHaveBeenCalledOnce();
        expect(button).toBeDisabled();
    });
});

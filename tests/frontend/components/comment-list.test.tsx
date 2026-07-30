import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import CommentList from '@/components/comment-list';
import type { Comment } from '@/types';

const routerMock = vi.hoisted(() => ({ delete: vi.fn() }));

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        ...props
    }: ComponentProps<'a'> & { children: ReactNode }) => (
        <a {...props}>{children}</a>
    ),
    router: routerMock,
}));

const comment: Comment = {
    id: 4,
    body: 'Lovely photo',
    created_at: '2026-07-30T10:00:00Z',
    user: {
        id: 2,
        name: 'Ada Lovelace',
        username: 'ada',
        avatar_url: null,
    },
    can: { delete: true },
};

beforeEach(() => routerMock.delete.mockReset());

describe('CommentList', () => {
    it('shows an empty state when there are no comments', () => {
        render(<CommentList comments={[]} />);

        expect(
            screen.getByRole('heading', { name: /no comments yet/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/start the conversation/i)).toBeInTheDocument();
    });

    it('shows comments and only permits authorized deletion', () => {
        render(
            <CommentList
                comments={[
                    comment,
                    {
                        ...comment,
                        id: 5,
                        body: 'Another comment',
                        user: { ...comment.user, username: 'grace' },
                        can: { delete: false },
                    },
                ]}
            />,
        );

        expect(screen.getByText('Lovely photo')).toBeInTheDocument();
        expect(screen.getByText('Another comment')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /delete comment by ada/i }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /delete comment by grace/i }),
        ).not.toBeInTheDocument();
    });

    it('disables deletion while the request is pending and restores it on finish', async () => {
        const user = userEvent.setup();
        render(<CommentList comments={[comment]} />);
        const button = screen.getByRole('button', {
            name: /delete comment by ada/i,
        });

        await user.click(button);

        expect(routerMock.delete).toHaveBeenCalledOnce();
        expect(button).toBeDisabled();

        const options = routerMock.delete.mock.calls[0][1] as {
            onFinish: () => void;
        };
        act(() => options.onFinish());
        expect(button).toBeEnabled();
    });

    it('calls onDeleted when a comment is successfully deleted', async () => {
        const user = userEvent.setup();
        const onDeleted = vi.fn();
        render(<CommentList comments={[comment]} onDeleted={onDeleted} />);
        const button = screen.getByRole('button', {
            name: /delete comment by ada/i,
        });

        await user.click(button);

        const options = routerMock.delete.mock.calls[0][1] as {
            onSuccess: () => void;
            onFinish: () => void;
        };

        expect(onDeleted).not.toHaveBeenCalled();

        act(() => options.onSuccess());

        expect(onDeleted).toHaveBeenCalledOnce();
    });

    it('does not require onDeleted to be provided', async () => {
        const user = userEvent.setup();
        render(<CommentList comments={[comment]} />);
        const button = screen.getByRole('button', {
            name: /delete comment by ada/i,
        });

        await user.click(button);

        const options = routerMock.delete.mock.calls[0][1] as {
            onSuccess: () => void;
        };

        expect(() => act(() => options.onSuccess())).not.toThrow();
    });
});

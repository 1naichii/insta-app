import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps, ReactNode } from 'react';
import PostModal from '@/components/post-modal';
import type { Comment, Post } from '@/types';

const viewport = vi.hoisted(() => ({ isMobile: false }));
const commentFormMock = vi.hoisted(() => ({
    lifecycle: undefined as
        { onError?: () => void; onSuccess?: () => void } | undefined,
}));

vi.mock('@inertiajs/react', () => ({
    Link: ({
        children,
        ...props
    }: ComponentProps<'a'> & { children: ReactNode }) => (
        <a {...props}>{children}</a>
    ),
    usePage: () => ({
        props: {
            auth: {
                user: {
                    id: 1,
                    name: 'Demo User',
                    username: 'demo',
                    avatar_url: null,
                },
            },
        },
    }),
}));

vi.mock('@/components/comment-form', () => ({
    default: ({
        postId,
        onCreated,
    }: {
        postId: number;
        onCreated?: (body: string) => {
            onError?: () => void;
            onSuccess?: () => void;
        };
    }) => (
        <form aria-label={`Comment form for post ${postId}`}>
            <button
                type="button"
                onClick={() => {
                    commentFormMock.lifecycle = onCreated?.(
                        'An optimistic comment',
                    );
                }}
            >
                Post comment
            </button>
        </form>
    ),
}));

vi.mock('@/components/comment-list', () => ({
    default: ({ comments }: { comments: Comment[] }) => (
        <ul>
            {comments.map((comment) => (
                <li key={comment.id}>{comment.body}</li>
            ))}
        </ul>
    ),
}));

vi.mock('@/components/post-actions-menu', () => ({
    default: () => null,
}));

vi.mock('@/components/post-like-button', () => ({
    default: () => <button type="button">Like post</button>,
}));

vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
        open ? <div>{children}</div> : null,
    DialogContent: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    DialogDescription: ({ children }: { children: ReactNode }) => (
        <p>{children}</p>
    ),
    DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/sheet', () => ({
    Sheet: ({ open, children }: { open: boolean; children: ReactNode }) =>
        open ? <div>{children}</div> : null,
    SheetContent: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
    ),
    SheetDescription: ({ children }: { children: ReactNode }) => (
        <p>{children}</p>
    ),
    SheetTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/skeleton', () => ({
    Skeleton: () => <div data-testid="comments-skeleton" />,
}));

vi.mock('@/hooks/use-mobile', () => ({
    useIsMobile: () => viewport.isMobile,
}));

const post: Post = {
    id: 7,
    caption: 'A day by the sea',
    image_url: 'https://example.test/sea.jpg',
    created_at: '2026-07-30T10:00:00Z',
    likes_count: 4,
    comments_count: 1,
    liked_by_user: false,
    user: {
        id: 2,
        name: 'Ada Lovelace',
        username: 'ada',
        avatar_url: null,
    },
    can: { update: false, delete: false },
};

const comment: Comment = {
    id: 4,
    body: 'Lovely photo',
    created_at: '2026-07-30T10:10:00Z',
    user: post.user,
    can: { delete: false },
};

function responseWithComments(comments: Comment[]): Response {
    return {
        ok: true,
        json: () => Promise.resolve({ comments }),
    } as Response;
}

beforeEach(() => {
    viewport.isMobile = false;
    commentFormMock.lifecycle = undefined;
    vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('PostModal', () => {
    it('renders no modal content and does not fetch while closed', () => {
        render(<PostModal post={post} open={false} onOpenChange={vi.fn()} />);

        expect(screen.queryByText(post.caption!)).not.toBeInTheDocument();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('shows loading content, fetches comments, and renders the comment form', async () => {
        let resolveRequest: (response: Response) => void = () => undefined;
        vi.mocked(fetch).mockReturnValueOnce(
            new Promise((resolve) => {
                resolveRequest = resolve;
            }),
        );

        render(<PostModal post={post} open onOpenChange={vi.fn()} />);

        expect(screen.getAllByTestId('comments-skeleton')).toHaveLength(12);
        expect(fetch).toHaveBeenCalledWith('/posts/7/comments', {
            headers: { Accept: 'application/json' },
            signal: expect.any(AbortSignal),
        });
        expect(
            screen.getByRole('form', { name: 'Comment form for post 7' }),
        ).toBeInTheDocument();

        resolveRequest(responseWithComments([comment]));

        expect(await screen.findByText('Lovely photo')).toBeInTheDocument();
        expect(
            screen.queryByTestId('comments-skeleton'),
        ).not.toBeInTheDocument();
    });

    it('shows an error and retries the comments request', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch)
            .mockResolvedValueOnce({ ok: false } as Response)
            .mockResolvedValueOnce(responseWithComments([comment]));

        render(<PostModal post={post} open onOpenChange={vi.fn()} />);

        expect(
            await screen.findByText("Couldn't load comments."),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Try again' }));

        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(await screen.findByText('Lovely photo')).toBeInTheDocument();
    });

    it('shows a comment immediately and removes it when creation fails', async () => {
        const user = userEvent.setup();
        vi.mocked(fetch).mockReturnValueOnce(new Promise(() => undefined));
        render(<PostModal post={post} open onOpenChange={vi.fn()} />);
        await waitFor(() => expect(fetch).toHaveBeenCalledOnce());

        await user.click(screen.getByRole('button', { name: 'Post comment' }));

        expect(screen.getByText('An optimistic comment')).toBeInTheDocument();

        act(() => commentFormMock.lifecycle?.onError?.());

        expect(
            screen.queryByText('An optimistic comment'),
        ).not.toBeInTheDocument();
    });

    it("does not replace a new post's comments with a late refresh", async () => {
        const user = userEvent.setup();
        const postB = { ...post, id: 8, caption: 'A second post' };
        const commentA = { ...comment, body: 'Comment from post A' };
        const commentB = { ...comment, id: 5, body: 'Comment from post B' };
        let resolvePostARefresh: (response: Response) => void = () => undefined;
        let resolvePostBRequest: (response: Response) => void = () => undefined;

        vi.mocked(fetch)
            .mockResolvedValueOnce(responseWithComments([]))
            .mockReturnValueOnce(
                new Promise((resolve) => {
                    resolvePostARefresh = resolve;
                }),
            )
            .mockReturnValueOnce(
                new Promise((resolve) => {
                    resolvePostBRequest = resolve;
                }),
            );

        const { rerender } = render(
            <PostModal post={post} open onOpenChange={vi.fn()} />,
        );
        await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
        await user.click(screen.getByRole('button', { name: 'Post comment' }));

        act(() => commentFormMock.lifecycle?.onSuccess?.());
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

        rerender(<PostModal post={postB} open onOpenChange={vi.fn()} />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));

        resolvePostBRequest(responseWithComments([commentB]));
        expect(await screen.findByText(commentB.body)).toBeInTheDocument();

        await act(async () => {
            resolvePostARefresh(responseWithComments([commentA]));
            await Promise.resolve();
        });

        expect(screen.queryByText(commentA.body)).not.toBeInTheDocument();
        expect(screen.getByText(commentB.body)).toBeInTheDocument();
    });

    it('does not show a load error when a comments request is aborted', async () => {
        const user = userEvent.setup();
        let rejectRefresh: (reason: DOMException) => void = () => undefined;
        let refreshSignal: AbortSignal | undefined;
        vi.mocked(fetch)
            .mockResolvedValueOnce(responseWithComments([]))
            .mockImplementationOnce((_input, init) => {
                refreshSignal = init?.signal ?? undefined;

                return new Promise((_resolve, reject) => {
                    rejectRefresh = reject;
                });
            })
            .mockReturnValueOnce(new Promise(() => undefined));

        const { rerender } = render(
            <PostModal post={post} open onOpenChange={vi.fn()} />,
        );
        await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
        await user.click(screen.getByRole('button', { name: 'Post comment' }));
        act(() => commentFormMock.lifecycle?.onSuccess?.());
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

        rerender(<PostModal post={post} open={false} onOpenChange={vi.fn()} />);
        expect(refreshSignal?.aborted).toBe(true);
        rerender(<PostModal post={post} open onOpenChange={vi.fn()} />);

        await act(async () => {
            rejectRefresh(new DOMException('Aborted', 'AbortError'));
            await Promise.resolve();
        });

        expect(
            screen.queryByText("Couldn't load comments."),
        ).not.toBeInTheDocument();
    });

    it('renders the mobile comments sheet and closes from its back button', async () => {
        const user = userEvent.setup();
        const onOpenChange = vi.fn();
        viewport.isMobile = true;
        vi.mocked(fetch).mockResolvedValueOnce(responseWithComments([]));

        render(<PostModal post={post} open onOpenChange={onOpenChange} />);

        expect(
            screen.getByRole('heading', { name: 'Comments' }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Back' }));

        expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows a multiline caption in full without clamping it', () => {
        const multilineCaption =
            'First line\nSecond line\nThird line\nFourth line';
        vi.mocked(fetch).mockResolvedValueOnce(responseWithComments([]));
        const { container } = render(
            <PostModal
                post={{ ...post, caption: multilineCaption }}
                open
                onOpenChange={vi.fn()}
            />,
        );
        const caption = container.querySelector('p.whitespace-pre-line');

        expect(caption?.textContent).toContain(multilineCaption);
        expect(caption).not.toHaveClass('line-clamp-3');
        expect(
            screen.queryByRole('button', { name: 'see more' }),
        ).not.toBeInTheDocument();
    });
});

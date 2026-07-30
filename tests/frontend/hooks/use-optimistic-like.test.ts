import { act, renderHook } from '@testing-library/react';
import { useOptimisticLike } from '@/hooks/use-optimistic-like';
import type { Post } from '@/types';

const routerMock = vi.hoisted(() => ({
    delete: vi.fn(),
    post: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({ router: routerMock }));

const post: Post = {
    id: 7,
    caption: null,
    image_url: '/image.jpg',
    created_at: '2026-07-30T10:00:00Z',
    likes_count: 10,
    comments_count: 0,
    liked_by_user: false,
    user: {
        id: 2,
        name: 'Ada Lovelace',
        username: 'ada',
        avatar_url: null,
    },
    can: { update: false, delete: false },
};

beforeEach(() => {
    routerMock.delete.mockReset();
    routerMock.post.mockReset();
});

describe('useOptimisticLike', () => {
    it('updates the value immediately and ignores a second toggle in flight', () => {
        const { result } = renderHook(() => useOptimisticLike(post));

        act(() => result.current.toggle());

        expect(result.current.liked).toBe(true);
        expect(result.current.likesCount).toBe(11);
        expect(result.current.processing).toBe(true);

        act(() => result.current.toggle());

        expect(routerMock.post).toHaveBeenCalledOnce();
        expect(routerMock.delete).not.toHaveBeenCalled();
    });

    it('rolls back when the request errors', () => {
        const { result } = renderHook(() => useOptimisticLike(post));
        act(() => result.current.toggle());

        const options = routerMock.post.mock.calls[0][2] as {
            onError: () => void;
            onFinish: () => void;
        };
        act(() => options.onError());

        expect(result.current.liked).toBe(false);
        expect(result.current.likesCount).toBe(10);

        act(() => options.onFinish());
        expect(result.current.processing).toBe(false);
    });

    it('keeps the optimistic value until server props advance', () => {
        const { result, rerender } = renderHook(
            ({ currentPost }: { currentPost: Post }) =>
                useOptimisticLike(currentPost),
            { initialProps: { currentPost: post } },
        );
        act(() => result.current.toggle());

        const options = routerMock.post.mock.calls[0][2] as {
            onFinish: () => void;
        };
        act(() => options.onFinish());
        rerender({ currentPost: { ...post } });

        expect(result.current.liked).toBe(true);
        expect(result.current.likesCount).toBe(11);

        rerender({
            currentPost: {
                ...post,
                liked_by_user: true,
                likes_count: 11,
            },
        });
        rerender({
            currentPost: {
                ...post,
                liked_by_user: false,
                likes_count: 10,
            },
        });

        expect(result.current.liked).toBe(false);
        expect(result.current.likesCount).toBe(10);
    });

    it('optimistically removes an existing like', () => {
        const { result } = renderHook(() =>
            useOptimisticLike({ ...post, liked_by_user: true }),
        );

        act(() => result.current.toggle());

        expect(result.current.liked).toBe(false);
        expect(result.current.likesCount).toBe(9);
        expect(routerMock.delete).toHaveBeenCalledOnce();
    });
});

import { act, renderHook } from '@testing-library/react';
import { useOptimisticLike } from '@/hooks/use-optimistic-like';
import type { Post } from '@/types';

const httpMock = vi.hoisted(() => ({
    delete: vi.fn(),
    post: vi.fn(),
}));

vi.mock('@inertiajs/react', () => ({ useHttp: () => httpMock }));

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
    httpMock.delete.mockReset().mockReturnValue(new Promise(() => undefined));
    httpMock.post.mockReset().mockReturnValue(new Promise(() => undefined));
});

describe('useOptimisticLike', () => {
    it('updates the value immediately and ignores a second toggle in flight', () => {
        const { result } = renderHook(() => useOptimisticLike(post));

        act(() => result.current.toggle());

        expect(result.current.liked).toBe(true);
        expect(result.current.likesCount).toBe(11);
        expect(result.current.processing).toBe(true);

        act(() => result.current.toggle());

        expect(httpMock.post).toHaveBeenCalledOnce();
        expect(httpMock.delete).not.toHaveBeenCalled();
    });

    it('rolls back when the request errors', () => {
        const rollbackPost = { ...post, id: 8 };
        const { result } = renderHook(() => useOptimisticLike(rollbackPost));
        act(() => result.current.toggle());

        const options = httpMock.post.mock.calls[0][1] as {
            onError: () => void;
            onFinish: () => void;
        };
        act(() => options.onError());

        expect(result.current.liked).toBe(false);
        expect(result.current.likesCount).toBe(10);

        act(() => options.onFinish());
        expect(result.current.processing).toBe(false);
    });

    it('replaces the optimistic value with the server response', () => {
        const confirmedPost = { ...post, id: 9 };
        const { result } = renderHook(() => useOptimisticLike(confirmedPost));
        act(() => result.current.toggle());

        const options = httpMock.post.mock.calls[0][1] as {
            onSuccess: (response: {
                liked: boolean;
                likes_count: number;
            }) => void;
            onFinish: () => void;
        };
        act(() => {
            options.onSuccess({ liked: true, likes_count: 12 });
            options.onFinish();
        });

        expect(result.current.liked).toBe(true);
        expect(result.current.likesCount).toBe(12);
        expect(result.current.processing).toBe(false);
    });

    it('propagates the state to another rendering of the same post', () => {
        const sharedPost = { ...post, id: 10 };
        const { result } = renderHook(() => ({
            first: useOptimisticLike(sharedPost),
            second: useOptimisticLike({ ...sharedPost }),
        }));

        act(() => result.current.first.toggle());

        expect(result.current.second.liked).toBe(true);
        expect(result.current.second.likesCount).toBe(11);
        expect(result.current.second.processing).toBe(true);
    });

    it('optimistically removes an existing like', () => {
        const { result } = renderHook(() =>
            useOptimisticLike({ ...post, id: 11, liked_by_user: true }),
        );

        act(() => result.current.toggle());

        expect(result.current.liked).toBe(false);
        expect(result.current.likesCount).toBe(9);
        expect(httpMock.delete).toHaveBeenCalledOnce();
    });
});

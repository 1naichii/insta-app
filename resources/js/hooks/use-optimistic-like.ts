import { useHttp } from '@inertiajs/react';
import { useRef, useSyncExternalStore } from 'react';
import posts from '@/routes/posts';
import type { Post } from '@/types';

type LikeState = {
    liked: boolean;
    likesCount: number;
    processing: boolean;
};

type LikeResponse = {
    liked: boolean;
    likes_count: number;
};

const states = new Map<number, LikeState>();
const listeners = new Map<number, Set<() => void>>();
const allListeners = new Set<() => void>();
let revision = 0;

function stateFor(post: Post): LikeState {
    const existing = states.get(post.id);

    if (existing) {
        return existing;
    }

    const initial = {
        liked: post.liked_by_user,
        likesCount: post.likes_count,
        processing: false,
    };
    states.set(post.id, initial);

    return initial;
}

export function postLikeState(post: Post) {
    return stateFor(post);
}

function publish(postId: number, state: LikeState) {
    states.set(postId, state);
    revision += 1;
    listeners.get(postId)?.forEach((listener) => listener());
    allListeners.forEach((listener) => listener());
}

function subscribe(postId: number, listener: () => void) {
    const postListeners = listeners.get(postId) ?? new Set();
    postListeners.add(listener);
    listeners.set(postId, postListeners);

    return () => {
        postListeners.delete(listener);
    };
}

export function usePostLikeState(post: Post) {
    return useSyncExternalStore(
        (listener) => subscribe(post.id, listener),
        () => stateFor(post),
        () => stateFor(post),
    );
}

export function useLikesRevision() {
    return useSyncExternalStore(
        (listener) => {
            allListeners.add(listener);

            return () => {
                allListeners.delete(listener);
            };
        },
        () => revision,
        () => revision,
    );
}

export function useOptimisticLike(post: Post) {
    const http = useHttp<Record<string, never>, LikeResponse>({});
    const state = usePostLikeState(post);
    const processingRef = useRef(false);

    function toggle() {
        if (processingRef.current || state.processing) {
            return;
        }

        const previous = state;
        const nextLiked = !previous.liked;

        processingRef.current = true;
        publish(post.id, {
            liked: nextLiked,
            likesCount: previous.likesCount + (nextLiked ? 1 : -1),
            processing: true,
        });

        const options = {
            onSuccess: (response: LikeResponse) => {
                publish(post.id, {
                    liked: response.liked,
                    likesCount: response.likes_count,
                    processing: true,
                });
            },
            onError: () => publish(post.id, previous),
            onHttpException: () => publish(post.id, previous),
            onNetworkError: () => publish(post.id, previous),
            onCancel: () => publish(post.id, previous),
            onFinish: () => {
                processingRef.current = false;
                publish(post.id, {
                    ...(states.get(post.id) ?? previous),
                    processing: false,
                });
            },
        };

        const request = nextLiked
            ? http.post(posts.likes.store(post.id).url, options)
            : http.delete(posts.likes.destroy(post.id).url, options);

        void request.catch(() => undefined);
    }

    return { ...state, toggle };
}

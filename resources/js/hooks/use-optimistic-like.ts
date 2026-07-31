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

type LikeEntry = {
    state: LikeState;
    sources: WeakSet<Post>;
};

const states = new Map<number, LikeEntry>();
const listeners = new Map<number, Set<() => void>>();
const allListeners = new Set<() => void>();
let revision = 0;
let storeUserId: number | null | undefined;

function stateFrom(post: Post): LikeState {
    return {
        liked: post.liked_by_user,
        likesCount: post.likes_count,
        processing: false,
    };
}

export function setLikeStoreUser(userId: number | null) {
    if (storeUserId === userId) {
        return;
    }

    storeUserId = userId;
    states.clear();
    revision += 1;
}

function stateFor(post: Post): LikeState {
    const existing = states.get(post.id);

    if (existing) {
        if (!existing.sources.has(post)) {
            existing.sources.add(post);

            // A new Post object represents fresh server props. It wins unless
            // an optimistic request is still responsible for the live state.
            if (!existing.state.processing) {
                existing.state = stateFrom(post);
            }
        }

        return existing.state;
    }

    const initial = stateFrom(post);
    states.set(post.id, {
        state: initial,
        sources: new WeakSet([post]),
    });

    return initial;
}

function entryFor(postId: number, state: LikeState): LikeEntry {
    return (
        states.get(postId) ?? {
            state,
            sources: new WeakSet(),
        }
    );
}

export function postLikeState(post: Post) {
    return stateFor(post);
}

function publish(postId: number, state: LikeState) {
    const entry = entryFor(postId, state);
    entry.state = state;
    states.set(postId, entry);
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

        if (postListeners.size === 0) {
            listeners.delete(postId);
        }
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
                    ...(states.get(post.id)?.state ?? previous),
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

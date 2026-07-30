import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import posts from '@/routes/posts';
import type { Post } from '@/types';

export function useOptimisticLike(post: Post) {
    const [optimisticLike, setOptimisticLike] = useState<{
        liked: boolean;
        likesCount: number;
        postId: number;
        previousLiked: boolean;
        previousLikesCount: number;
    } | null>(null);
    const [processing, setProcessing] = useState(false);
    const processingRef = useRef(false);

    let currentOptimisticLike = optimisticLike;

    // Keep the confirmed intent while props are still the pre-request snapshot.
    // Once props advance, they are authoritative even if the new value differs.
    if (
        currentOptimisticLike &&
        (currentOptimisticLike.postId !== post.id ||
            currentOptimisticLike.previousLiked !== post.liked_by_user ||
            currentOptimisticLike.previousLikesCount !== post.likes_count)
    ) {
        currentOptimisticLike = null;
        setOptimisticLike(null);
    }

    const liked = currentOptimisticLike?.liked ?? post.liked_by_user;
    const likesCount = currentOptimisticLike?.likesCount ?? post.likes_count;

    function toggle() {
        if (processingRef.current) {
            return;
        }

        const previousLiked = liked;
        const previousLikesCount = likesCount;
        const nextLiked = !previousLiked;

        processingRef.current = true;
        setProcessing(true);
        setOptimisticLike({
            liked: nextLiked,
            likesCount: previousLikesCount + (nextLiked ? 1 : -1),
            postId: post.id,
            previousLiked,
            previousLikesCount,
        });

        const options = {
            preserveScroll: true,
            preserveState: true,
            onError: () => setOptimisticLike(null),
            onFinish: () => {
                processingRef.current = false;
                setProcessing(false);
            },
        };

        if (nextLiked) {
            router.post(posts.likes.store(post.id).url, {}, options);
        } else {
            router.delete(posts.likes.destroy(post.id).url, options);
        }
    }

    return { liked, likesCount, processing, toggle };
}

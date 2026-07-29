import { router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import posts from '@/routes/posts';
import type { Post } from '@/types';

export function useOptimisticLike(post: Post) {
    const [optimisticLike, setOptimisticLike] = useState<{
        liked: boolean;
        likesCount: number;
    } | null>(null);
    const [processing, setProcessing] = useState(false);
    const processingRef = useRef(false);

    const liked = optimisticLike?.liked ?? post.liked_by_user;
    const likesCount = optimisticLike?.likesCount ?? post.likes_count;

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
        });

        const options = {
            preserveScroll: true,
            preserveState: true,
            onError: () => setOptimisticLike(null),
            onFinish: () => {
                processingRef.current = false;
                setProcessing(false);
                setOptimisticLike(null);
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

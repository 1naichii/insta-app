import LikeButton from '@/components/like-button';
import { useOptimisticLike } from '@/hooks/use-optimistic-like';
import type { Post } from '@/types';

type Props = {
    post: Post;
};

export default function PostLikeButton({ post }: Props) {
    const { liked, likesCount, processing, toggle } = useOptimisticLike(post);

    return (
        <LikeButton
            liked={liked}
            likesCount={likesCount}
            processing={processing}
            onToggle={toggle}
        />
    );
}

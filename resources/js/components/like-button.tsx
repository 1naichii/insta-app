import { Heart } from 'lucide-react';
import { formatCount } from '@/lib/format';
import {
    POST_ACTION_CLASS,
    POST_ACTION_ICON_CLASS,
    POST_ACTION_ICON_STROKE,
} from '@/lib/post-actions';
import { cn } from '@/lib/utils';

type Props = {
    liked: boolean;
    likesCount: number;
    onToggle: () => void;
    processing?: boolean;
    className?: string;
};

export default function LikeButton({
    liked,
    likesCount,
    onToggle,
    processing = false,
    className,
}: Props) {
    return (
        <button
            type="button"
            aria-label={liked ? 'Unlike post' : 'Like post'}
            aria-pressed={liked}
            disabled={processing}
            onClick={onToggle}
            className={cn(
                POST_ACTION_CLASS,
                'disabled:cursor-not-allowed disabled:opacity-50',
                liked ? 'text-red-500 hover:text-red-600' : 'text-foreground',
                className,
            )}
        >
            <Heart
                className={cn(POST_ACTION_ICON_CLASS, liked && 'fill-current')}
                strokeWidth={POST_ACTION_ICON_STROKE}
                aria-hidden="true"
            />
            <span>{formatCount(likesCount)}</span>
        </button>
    );
}

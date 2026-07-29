import { Heart } from 'lucide-react';
import { formatCount } from '@/lib/format';
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
                'inline-flex items-center gap-1 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                liked
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-muted-foreground hover:text-foreground',
                className,
            )}
        >
            <Heart
                className={cn('size-4', liked && 'fill-current')}
                aria-hidden="true"
            />
            <span>{formatCount(likesCount)}</span>
        </button>
    );
}

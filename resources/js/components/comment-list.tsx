import { Link, router } from '@inertiajs/react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { formatPostDate } from '@/lib/format';
import { destroy } from '@/routes/comments';
import { show as showProfile } from '@/routes/profile';
import type { Comment } from '@/types';

type Props = {
    comments: Comment[];
};

export default function CommentList({ comments }: Props) {
    const [pendingCommentIds, setPendingCommentIds] = useState<Set<number>>(
        new Set(),
    );

    function deleteComment(comment: Comment) {
        setPendingCommentIds((current) => new Set(current).add(comment.id));

        router.delete(destroy(comment.id), {
            preserveScroll: true,
            onFinish: () => {
                setPendingCommentIds((current) => {
                    const next = new Set(current);
                    next.delete(comment.id);

                    return next;
                });
            },
        });
    }

    if (comments.length === 0) {
        return (
            <EmptyState
                title="No comments yet"
                description="Start the conversation by leaving a comment."
                icon={MessageCircle}
                className="p-6"
            />
        );
    }

    return (
        <div className="divide-y divide-border">
            {comments.map((comment) => {
                const isPending = pendingCommentIds.has(comment.id);

                return (
                    <article
                        key={comment.id}
                        className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                        <div className="min-w-0 space-y-1">
                            <p className="text-sm whitespace-pre-line text-foreground">
                                <Link
                                    href={showProfile(comment.user.username)}
                                    className="font-semibold hover:underline"
                                >
                                    {comment.user.username}
                                </Link>{' '}
                                {comment.body}
                            </p>
                            <time
                                dateTime={comment.created_at}
                                className="block text-xs text-muted-foreground"
                            >
                                {formatPostDate(comment.created_at)}
                            </time>
                        </div>

                        {comment.can.delete && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                disabled={isPending}
                                onClick={() => deleteComment(comment)}
                                aria-label={`Delete comment by ${comment.user.username}`}
                            >
                                {isPending ? <Spinner /> : <Trash2 />}
                            </Button>
                        )}
                    </article>
                );
            })}
        </div>
    );
}

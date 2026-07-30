import { Link, router } from '@inertiajs/react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeletePostDialog from '@/components/delete-post-dialog';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { formatPostDate } from '@/lib/format';
import { destroy } from '@/routes/comments';
import { show as showProfile } from '@/routes/profile';
import type { Comment } from '@/types';

type Props = {
    comments: Comment[];
    onDeleted?: () => void;
};

export default function CommentList({ comments, onDeleted }: Props) {
    const [deletedCommentIds, setDeletedCommentIds] = useState<Set<number>>(
        new Set(),
    );
    const visibleComments = comments.filter(
        (comment) => !deletedCommentIds.has(comment.id),
    );

    function deleteComment(comment: Comment) {
        setDeletedCommentIds((current) => new Set(current).add(comment.id));

        router.delete(destroy(comment.id), {
            preserveScroll: true,
            onError: () => {
                setDeletedCommentIds((current) => {
                    const next = new Set(current);
                    next.delete(comment.id);

                    return next;
                });
            },
            onSuccess: () => onDeleted?.(),
        });
    }

    if (visibleComments.length === 0) {
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
            {visibleComments.map((comment) => {
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
                            <DeletePostDialog
                                onConfirm={() => deleteComment(comment)}
                                title="Delete this comment?"
                                description="This action cannot be undone. This will permanently delete the comment."
                                trigger={
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                        aria-label={`Delete comment by ${comment.user.username}`}
                                    >
                                        <Trash2 />
                                    </Button>
                                }
                            />
                        )}
                    </article>
                );
            })}
        </div>
    );
}

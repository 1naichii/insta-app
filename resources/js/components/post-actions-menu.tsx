import { Link, router } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeletePostDialog from '@/components/delete-post-dialog';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { destroy, edit } from '@/routes/posts';
import type { Post } from '@/types';

type Props = {
    post: Post;
};

export default function PostActionsMenu({ post }: Props) {
    const [processing, setProcessing] = useState(false);

    if (!post.can.update && !post.can.delete) {
        return null;
    }

    function handleDelete() {
        setProcessing(true);

        router.delete(destroy(post.id).url, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Post options">
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {post.can.update && (
                    <DropdownMenuItem asChild>
                        <Link href={edit(post.id)}>
                            <Pencil />
                            Edit post
                        </Link>
                    </DropdownMenuItem>
                )}

                {post.can.update && post.can.delete && (
                    <DropdownMenuSeparator />
                )}

                {post.can.delete && (
                    // The dialog's trigger is rendered here (inside
                    // DropdownMenuContent) so the DropdownMenuItem keeps its
                    // menu semantics (roving focus, closing on Escape, etc).
                    // `onSelect` calls `preventDefault()` so selecting the
                    // item does NOT unmount DropdownMenuContent - if it did,
                    // the Dialog (a descendant of the trigger) would be
                    // unmounted with it before it ever opened. The dropdown
                    // is left open behind the dialog's overlay, which is
                    // harmless since the overlay covers it and the delete
                    // action navigates away on success.
                    <DeletePostDialog
                        onConfirm={handleDelete}
                        processing={processing}
                        trigger={
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={(event) => event.preventDefault()}
                            >
                                <Trash2 />
                                Delete post
                            </DropdownMenuItem>
                        }
                    />
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

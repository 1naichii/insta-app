import { Trash2Icon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';

export default function DeletePostDialog({
    onConfirm,
    processing = false,
    error,
    trigger,
    title = 'Delete this post?',
    description = (
        <>
            This action cannot be undone. This will permanently delete the post
            and all of its associated data.
        </>
    ),
}: {
    onConfirm: () => void;
    processing?: boolean;
    error?: string;
    trigger?: ReactNode;
    title?: ReactNode;
    description?: ReactNode;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ?? (
                    <Button variant="destructive">
                        <Trash2Icon />
                        Delete post
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="z-[60]">
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                <InputError message={error} role="alert" />

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" disabled={processing}>
                            Cancel
                        </Button>
                    </DialogClose>

                    <Button
                        variant="destructive"
                        disabled={processing}
                        onClick={onConfirm}
                        aria-label="Confirm delete"
                    >
                        {processing && <Spinner />}
                        Confirm delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

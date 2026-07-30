import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { store } from '@/routes/posts/comments';

const MAX_COMMENT_LENGTH = 500;

type Props = {
    postId: number;
    onCreated?: (body: string) =>
        | {
              onError?: () => void;
              onSuccess?: () => void;
          }
        | undefined;
};

export default function CommentForm({ postId, onCreated }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        body: '',
    });

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!data.body.trim() || processing) {
            return;
        }

        const body = data.body.trim();
        const lifecycle = onCreated?.(body);

        post(store.url(postId), {
            preserveScroll: true,
            onError: () => lifecycle?.onError?.(),
            onSuccess: () => {
                reset('body');
                lifecycle?.onSuccess?.();
            },
        });
    }

    return (
        <form onSubmit={submit} className="grid gap-3">
            <Label htmlFor="comment-body">Add a comment</Label>
            <textarea
                id="comment-body"
                name="body"
                rows={3}
                maxLength={MAX_COMMENT_LENGTH}
                value={data.body}
                onChange={(event) => setData('body', event.target.value)}
                disabled={processing}
                placeholder="Write a comment..."
                aria-invalid={Boolean(errors.body)}
                className={cn(
                    'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                )}
            />

            <div className="flex items-center justify-between gap-2">
                <InputError message={errors.body} />
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {data.body.length}/{MAX_COMMENT_LENGTH}
                </span>
            </div>

            <Button
                type="submit"
                className="justify-self-start"
                disabled={processing || !data.body.trim()}
            >
                {processing && <Spinner />}
                Post comment
            </Button>
        </form>
    );
}

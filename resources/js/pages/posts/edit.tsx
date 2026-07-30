import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import ImageUpload from '@/components/image-upload';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { show, update } from '@/routes/posts';
import type { Post } from '@/types';

const MAX_CAPTION_LENGTH = 2200;

type Props = {
    post: Post;
};

export default function EditPost({ post }: Props) {
    const [image, setImage] = useState<File | null>(null);
    const [caption, setCaption] = useState(post.caption ?? '');

    return (
        <>
            <Head title="Edit post" />

            <div className="mx-auto w-full max-w-xl space-y-6 p-4">
                <Heading
                    title="Edit post"
                    description="Update your photo or caption"
                />

                <Form
                    {...update.form(post.id)}
                    disableWhileProcessing
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label>Current photo</Label>
                                <div className="overflow-hidden rounded-lg border border-border">
                                    <img
                                        src={post.image_url}
                                        alt="Current post photo"
                                        className="aspect-square w-full max-w-full object-cover"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <ImageUpload
                                    value={image}
                                    onChange={setImage}
                                    error={errors.image}
                                    disabled={processing}
                                    required={false}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to keep the current photo.
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="caption">Caption</Label>
                                <textarea
                                    id="caption"
                                    name="caption"
                                    rows={4}
                                    maxLength={MAX_CAPTION_LENGTH}
                                    value={caption}
                                    onChange={(event) =>
                                        setCaption(event.target.value)
                                    }
                                    disabled={processing}
                                    placeholder="Write a caption..."
                                    aria-invalid={Boolean(errors.caption)}
                                    className={cn(
                                        'flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                                        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                                    )}
                                />

                                <div className="flex items-center justify-between gap-2">
                                    <InputError message={errors.caption} />
                                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                        {caption.length}/{MAX_CAPTION_LENGTH}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    data-test="update-post-button"
                                >
                                    {processing && <Spinner />}
                                    Save changes
                                </Button>

                                <Link
                                    href={show(post.id)}
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

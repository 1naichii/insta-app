import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import ImageUpload from '@/components/image-upload';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { index, store } from '@/routes/posts';

const MAX_CAPTION_LENGTH = 2200;

export default function CreatePost() {
    const [image, setImage] = useState<File | null>(null);
    const [caption, setCaption] = useState('');

    return (
        <>
            <Head title="New post" />

            <div className="mx-auto w-full max-w-xl space-y-6 p-4">
                <Heading
                    title="New post"
                    description="Share a photo with your followers"
                />

                <Form
                    {...store.form()}
                    disableWhileProcessing
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <ImageUpload
                                value={image}
                                onChange={setImage}
                                error={errors.image}
                                disabled={processing}
                            />

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
                                    data-test="create-post-button"
                                >
                                    {processing && <Spinner />}
                                    Share
                                </Button>

                                <Link
                                    href={index()}
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

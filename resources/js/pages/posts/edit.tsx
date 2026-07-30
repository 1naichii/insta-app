import { Form, Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import ImageUpload from '@/components/image-upload';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { MAX_POST_CAPTION_LENGTH, POST_CAPTION_CLASS } from '@/lib/post-form';
import { index, update } from '@/routes/posts';
import type { Post } from '@/types';

type Props = {
    post: Post;
};

export default function EditPost({ post }: Props) {
    const [image, setImage] = useState<File | null>(null);
    const [caption, setCaption] = useState(post.caption ?? '');

    return (
        <>
            <Head title="Edit post" />

            <div className="mx-auto w-full max-w-3xl p-4">
                <Form {...update.form(post.id)} disableWhileProcessing>
                    {({ processing, errors }) => (
                        <Card className="gap-0 overflow-hidden py-0">
                            <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border py-4">
                                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                                    Edit post
                                </h1>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    data-test="update-post-button"
                                >
                                    {processing && <Spinner />}
                                    Save changes
                                </Button>
                            </CardHeader>

                            <CardContent className="grid gap-6 p-4 md:grid-cols-[minmax(0,1fr)_20rem] md:p-6">
                                <div className="grid content-start gap-2">
                                    <ImageUpload
                                        value={image}
                                        onChange={setImage}
                                        error={errors.image}
                                        disabled={processing}
                                        required={false}
                                        currentImageUrl={post.image_url}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty to keep the current photo.
                                    </p>
                                </div>

                                <div className="grid content-start gap-2">
                                    <Label htmlFor="caption">Caption</Label>
                                    <textarea
                                        id="caption"
                                        name="caption"
                                        rows={4}
                                        maxLength={MAX_POST_CAPTION_LENGTH}
                                        value={caption}
                                        onChange={(event) =>
                                            setCaption(event.target.value)
                                        }
                                        disabled={processing}
                                        placeholder="Write a caption..."
                                        aria-invalid={Boolean(errors.caption)}
                                        className={POST_CAPTION_CLASS}
                                    />

                                    <div className="flex items-center justify-between gap-2">
                                        <InputError message={errors.caption} />
                                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                            {caption.length}/
                                            {MAX_POST_CAPTION_LENGTH}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="justify-end border-t border-border p-4">
                                <Button asChild variant="ghost">
                                    <Link href={index()}>Cancel</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </Form>
            </div>
        </>
    );
}

import { Form, Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import ImageUpload from '@/components/image-upload';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

const MAX_BIO_LENGTH = 500;

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const [bio, setBio] = useState(auth.user.bio ?? '');
    const [avatar, setAvatar] = useState<File | null>(null);

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-5">
                <Heading
                    variant="small"
                    title="Profile"
                    description="Manage how you appear and how people can find you"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-8"
                >
                    {({ processing, errors }) => (
                        <>
                            <section className="space-y-3">
                                <h2 className="text-sm font-semibold">
                                    Profile photo
                                </h2>
                                <Card>
                                    <CardContent>
                                        <ImageUpload
                                            value={avatar}
                                            onChange={setAvatar}
                                            name="avatar"
                                            error={errors.avatar}
                                            disabled={processing}
                                            required={false}
                                            currentImageUrl={
                                                auth.user.avatar_url
                                            }
                                            displayName={auth.user.username}
                                        />
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-sm font-semibold">
                                    Account information
                                </h2>
                                <Card>
                                    <CardContent className="space-y-5">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Name</Label>

                                            <Input
                                                id="name"
                                                defaultValue={auth.user.name}
                                                name="name"
                                                maxLength={255}
                                                required
                                                autoComplete="name"
                                                placeholder="Full name"
                                            />

                                            <InputError message={errors.name} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="username">
                                                Username
                                            </Label>

                                            <Input
                                                id="username"
                                                defaultValue={
                                                    auth.user.username
                                                }
                                                name="username"
                                                maxLength={50}
                                                required
                                                autoComplete="username"
                                                placeholder="Username"
                                            />

                                            <InputError
                                                message={errors.username}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="email">
                                                Email address
                                            </Label>

                                            <Input
                                                id="email"
                                                type="email"
                                                defaultValue={auth.user.email}
                                                name="email"
                                                maxLength={255}
                                                required
                                                autoComplete="email"
                                                placeholder="Email address"
                                            />

                                            <InputError
                                                message={errors.email}
                                            />
                                        </div>

                                        {mustVerifyEmail &&
                                            auth.user.email_verified_at ===
                                                null && (
                                                <div className="rounded-lg border border-border bg-muted/40 p-3">
                                                    <p className="text-sm text-muted-foreground">
                                                        Your email address is
                                                        unverified.{' '}
                                                        <Link
                                                            href={send()}
                                                            as="button"
                                                            className="font-medium text-foreground underline underline-offset-4"
                                                        >
                                                            Re-send the
                                                            verification email.
                                                        </Link>
                                                    </p>

                                                    {status ===
                                                        'verification-link-sent' && (
                                                        <p className="mt-2 text-sm font-medium text-foreground">
                                                            A new verification
                                                            link has been sent
                                                            to your email
                                                            address.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="space-y-3">
                                <h2 className="text-sm font-semibold">Bio</h2>
                                <Card>
                                    <CardContent className="grid gap-2">
                                        <Label htmlFor="bio">
                                            Tell people about yourself
                                        </Label>

                                        <textarea
                                            id="bio"
                                            name="bio"
                                            rows={4}
                                            maxLength={MAX_BIO_LENGTH}
                                            value={bio}
                                            onChange={(event) =>
                                                setBio(event.target.value)
                                            }
                                            disabled={processing}
                                            placeholder="Tell people about yourself..."
                                            aria-invalid={Boolean(errors.bio)}
                                            className={cn(
                                                'block w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                                                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                                            )}
                                        />

                                        <div className="flex items-center justify-between gap-2">
                                            <InputError message={errors.bio} />
                                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                                                {bio.length}/{MAX_BIO_LENGTH}
                                            </span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="justify-end border-t border-border pt-6">
                                        <Button
                                            disabled={processing}
                                            data-test="update-profile-button"
                                        >
                                            {processing && <Spinner />}
                                            Save changes
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </section>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

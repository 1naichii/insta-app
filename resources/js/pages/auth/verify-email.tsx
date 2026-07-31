// Components
import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import LogoutConfirmationDialog from '@/components/logout-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { send } from '@/routes/verification';

export default function VerifyEmail({ status }: { status?: string }) {
    const [logoutOpen, setLogoutOpen] = useState(false);

    return (
        <>
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing} variant="secondary">
                            {processing && <Spinner />}
                            Resend verification email
                        </Button>

                        <button
                            type="button"
                            className="mx-auto block cursor-pointer text-sm text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                            onClick={() => setLogoutOpen(true)}
                        >
                            Log out
                        </button>
                    </>
                )}
            </Form>

            <LogoutConfirmationDialog
                open={logoutOpen}
                onOpenChange={setLogoutOpen}
            />
        </>
    );
}

VerifyEmail.layout = {
    title: 'Email verification',
    description:
        'Please verify your email address by clicking on the link we just emailed to you.',
};

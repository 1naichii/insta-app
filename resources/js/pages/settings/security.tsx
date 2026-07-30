import { Form, Head } from '@inertiajs/react';
import { useRef } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import type { Props as ManagePasskeysProps } from '@/components/manage-passkeys';
import ManagePasskeys from '@/components/manage-passkeys';
import type { Props as ManageTwoFactorProps } from '@/components/manage-two-factor';
import ManageTwoFactor from '@/components/manage-two-factor';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

type Props = {
    passwordRules: string;
} & ManagePasskeysProps &
    ManageTwoFactorProps;

export default function Security(props: Props) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-5">
                <Heading
                    variant="small"
                    title="Security"
                    description="Protect your account with a strong password and additional sign-in methods"
                />

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold">Password</h2>
                    <Card>
                        <Form
                            {...SecurityController.update.form()}
                            options={{
                                preserveScroll: true,
                            }}
                            resetOnError={[
                                'password',
                                'password_confirmation',
                                'current_password',
                            ]}
                            resetOnSuccess
                            onError={(errors) => {
                                if (errors.password) {
                                    passwordInput.current?.focus();
                                }

                                if (errors.current_password) {
                                    currentPasswordInput.current?.focus();
                                }
                            }}
                        >
                            {({ errors, processing }) => (
                                <>
                                    <CardContent className="space-y-5">
                                        <div className="grid gap-2">
                                            <Label htmlFor="current_password">
                                                Current password
                                            </Label>

                                            <PasswordInput
                                                id="current_password"
                                                ref={currentPasswordInput}
                                                name="current_password"
                                                autoComplete="current-password"
                                                placeholder="Current password"
                                            />

                                            <InputError
                                                message={
                                                    errors.current_password
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password">
                                                New password
                                            </Label>

                                            <PasswordInput
                                                id="password"
                                                ref={passwordInput}
                                                name="password"
                                                autoComplete="new-password"
                                                placeholder="New password"
                                                passwordrules={
                                                    props.passwordRules
                                                }
                                            />

                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">
                                                Confirm password
                                            </Label>

                                            <PasswordInput
                                                id="password_confirmation"
                                                name="password_confirmation"
                                                autoComplete="new-password"
                                                placeholder="Confirm password"
                                                passwordrules={
                                                    props.passwordRules
                                                }
                                            />

                                            <InputError
                                                message={
                                                    errors.password_confirmation
                                                }
                                            />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="justify-end border-t border-border pt-6">
                                        <Button
                                            disabled={processing}
                                            data-test="update-password-button"
                                        >
                                            Save password
                                        </Button>
                                    </CardFooter>
                                </>
                            )}
                        </Form>
                    </Card>
                </section>
            </div>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold">
                    Two-factor authentication
                </h2>
                <Card>
                    <CardContent>
                        <ManageTwoFactor
                            canManageTwoFactor={props.canManageTwoFactor}
                            requiresConfirmation={
                                props.requiresConfirmation ?? false
                            }
                            twoFactorEnabled={props.twoFactorEnabled ?? false}
                        />
                    </CardContent>
                </Card>
            </section>

            <section className="space-y-3">
                <h2 className="text-sm font-semibold">Passkeys</h2>
                <Card>
                    <CardContent>
                        <ManagePasskeys
                            canManagePasskeys={props.canManagePasskeys}
                            passkeys={props.passkeys}
                        />
                    </CardContent>
                </Card>
            </section>
        </>
    );
}

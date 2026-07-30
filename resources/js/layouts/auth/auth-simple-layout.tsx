import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    footer,
}: AuthLayoutProps & { footer?: ReactNode }) {
    return (
        <div className="flex min-h-svh items-center justify-center bg-background px-4 py-8 sm:px-6">
            <div className="flex w-full max-w-sm flex-col gap-3">
                <main className="border border-border bg-card px-6 py-8 sm:px-10 sm:py-10">
                    <div className="flex flex-col items-center gap-5 text-center">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 text-foreground"
                        >
                            <AppLogoIcon className="size-10" />
                            <span className="text-2xl font-semibold tracking-tight">
                                InstaApp
                            </span>
                        </Link>

                        <div className="space-y-1.5">
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">
                                {title}
                            </h1>
                            <p className="text-sm leading-5 text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>

                    <div className="mt-7">{children}</div>
                </main>

                {footer && (
                    <div className="border border-border bg-card px-6 py-5 text-center text-sm text-muted-foreground">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

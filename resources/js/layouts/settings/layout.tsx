import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Card } from '@/components/ui/card';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: edit(),
        icon: null,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: null,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="px-4 py-6 sm:px-6 lg:py-10">
            <Heading
                title="Settings"
                description="Manage your profile and account settings"
            />

            <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
                <aside className="w-full">
                    <nav
                        className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item) => (
                            <Link
                                key={toUrl(item.href)}
                                href={item.href}
                                className={cn(
                                    'flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm font-medium transition-colors last:border-b-0 hover:bg-muted/60',
                                    {
                                        'bg-muted text-foreground':
                                            isCurrentOrParentUrl(item.href),
                                    },
                                )}
                            >
                                <span>{item.title}</span>
                                <ChevronRight
                                    className="size-4 text-muted-foreground lg:hidden"
                                    aria-hidden="true"
                                />
                            </Link>
                        ))}
                    </nav>
                </aside>

                <Card className="min-w-0 gap-0 border-0 bg-transparent py-0 shadow-none">
                    <section className="space-y-10">{children}</section>
                </Card>
            </div>
        </div>
    );
}

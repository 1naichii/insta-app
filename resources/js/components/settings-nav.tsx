import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { NavItem } from '@/types';

const settingsNavItems: NavItem[] = [
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

export function SettingsNav() {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <nav
            className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
            aria-label="Settings"
        >
            {settingsNavItems.map((item) => (
                <Link
                    key={toUrl(item.href)}
                    href={item.href}
                    className={cn(
                        'flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm font-medium transition-colors last:border-b-0 hover:bg-muted/60',
                        {
                            'bg-muted text-foreground': isCurrentOrParentUrl(
                                item.href,
                            ),
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
    );
}

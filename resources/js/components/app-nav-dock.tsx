import { Link, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { House, SquarePlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppAccountMenu } from '@/components/app-account-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { create as createPost, index as feedIndex } from '@/routes/posts';
import { show as showProfile } from '@/routes/profile';

type DockLinkProps = {
    href: NonNullable<InertiaLinkProps['href']>;
    active: boolean;
    label: string;
    children: ReactNode;
};

function DockLink({ href, active, label, children }: DockLinkProps) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'flex flex-1 items-center justify-center p-3 text-foreground',
                !active && 'text-muted-foreground',
            )}
        >
            <span className="sr-only">{label}</span>
            {children}
        </Link>
    );
}

export default function AppNavDock() {
    const { auth } = usePage().props;
    const { isCurrentUrl } = useCurrentUrl();
    const getInitials = useInitials();

    if (!auth.user) {
        return null;
    }

    const { user } = auth;

    const feedHref = feedIndex();
    const createHref = createPost();
    const profileHref = showProfile(user.username);

    return (
        <nav
            aria-label="Main"
            className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-evenly border-t border-border bg-background md:hidden"
        >
            <DockLink
                href={feedHref}
                active={isCurrentUrl(feedHref)}
                label="Feed"
            >
                <House className="size-6" />
            </DockLink>
            <DockLink
                href={createHref}
                active={isCurrentUrl(createHref)}
                label="Create"
            >
                <SquarePlus className="size-6" />
            </DockLink>
            <DockLink
                href={profileHref}
                active={isCurrentUrl(profileHref)}
                label="Profile"
            >
                <Avatar className="size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
                    <AvatarImage src={user.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-muted text-[10px] text-foreground">
                        {getInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
            </DockLink>
            <div className="flex flex-1 items-center justify-center p-3">
                <AppAccountMenu />
            </div>
        </nav>
    );
}

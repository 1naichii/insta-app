import { Link, usePage } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import { House, Settings, SquarePlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppAccountMenu } from '@/components/app-account-menu';
import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { create as createPost, index as feedIndex } from '@/routes/posts';
import { edit as editProfile, show as showProfile } from '@/routes/profile';

type NavRailLinkProps = {
    href: NonNullable<InertiaLinkProps['href']>;
    active: boolean;
    label: string;
    children: ReactNode;
};

function NavRailLink({ href, active, label, children }: NavRailLinkProps) {
    return (
        <Link
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
                'flex items-center gap-3 overflow-hidden rounded-md p-2.5 text-foreground hover:bg-sidebar-accent',
                active && 'bg-sidebar-accent font-semibold',
            )}
        >
            {children}
            <span className="truncate text-sm whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {label}
            </span>
        </Link>
    );
}

export default function AppNavRail() {
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
    const settingsHref = editProfile();

    return (
        <nav
            aria-label="Main"
            className="group fixed inset-y-0 left-0 z-40 hidden w-[72px] flex-col overflow-hidden border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out hover:w-[244px] md:flex"
        >
            <div className="flex h-16 shrink-0 items-center gap-3 overflow-hidden px-[23px]">
                <AppLogoIcon className="size-7 shrink-0 text-foreground" />
                <span className="truncate text-lg font-semibold whitespace-nowrap text-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    InstaApp
                </span>
            </div>

            <div className="flex flex-1 flex-col gap-1 px-3 py-2">
                <NavRailLink
                    href={feedHref}
                    active={isCurrentUrl(feedHref)}
                    label="Feed"
                >
                    <House className="size-6 shrink-0" />
                </NavRailLink>
                <NavRailLink
                    href={createHref}
                    active={isCurrentUrl(createHref)}
                    label="Create"
                >
                    <SquarePlus className="size-6 shrink-0" />
                </NavRailLink>
                <NavRailLink
                    href={profileHref}
                    active={isCurrentUrl(profileHref)}
                    label="Profile"
                >
                    <Avatar className="size-6 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
                        <AvatarImage
                            src={user.avatar_url ?? undefined}
                            alt=""
                        />
                        <AvatarFallback className="bg-muted text-[10px] text-foreground">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                </NavRailLink>
                <NavRailLink
                    href={settingsHref}
                    active={isCurrentUrl(settingsHref)}
                    label="Settings"
                >
                    <Settings className="size-6 shrink-0" />
                </NavRailLink>
            </div>

            <div className="px-3 py-3">
                <AppAccountMenu showLabel />
            </div>
        </nav>
    );
}

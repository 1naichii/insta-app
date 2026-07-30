import { Link, router, usePage } from '@inertiajs/react';
import { LogOut, Menu, Settings } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { cn } from '@/lib/utils';
import { logout } from '@/routes';
import { index as settingsIndex } from '@/routes/settings';

type AppAccountMenuProps = {
    /**
     * When true, the user's display name is shown visibly next to the icon.
     * When false (default), the name is still present for accessibility
     * purposes but visually hidden via `sr-only`.
     */
    showLabel?: boolean;
    onOpenChange?: (open: boolean) => void;
};

/**
 * The account menu deliberately uses a menu icon rather than the user's
 * avatar: the navigation already shows the avatar on its Profile link, and
 * two avatars side by side read as a duplicated control.
 */
export function AppAccountMenu({
    showLabel = false,
    onOpenChange,
}: AppAccountMenuProps) {
    const { auth } = usePage().props;
    const isMobile = useIsMobile();
    const cleanup = useMobileNavigation();

    if (!auth.user) {
        return null;
    }

    const { user } = auth;
    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const trigger = (
        <button
            type="button"
            data-test="app-account-menu-trigger"
            className={cn(
                'flex w-full items-center gap-3 rounded-md p-2.5 text-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-sidebar-accent',
                !showLabel && 'justify-center',
            )}
        >
            <Menu className="size-6 shrink-0" aria-hidden="true" />
            <span
                className={cn(
                    'truncate text-sm font-medium whitespace-nowrap',
                    showLabel ? undefined : 'sr-only',
                )}
            >
                {user.name}
            </span>
        </button>
    );

    if (isMobile) {
        return (
            <Sheet>
                <SheetTrigger asChild>{trigger}</SheetTrigger>
                <SheetContent
                    side="right"
                    className="w-[280px] gap-0 p-0 sm:max-w-[280px]"
                >
                    <SheetDescription className="sr-only">
                        View account details, open settings, or log out.
                    </SheetDescription>

                    <div className="border-b border-border p-4">
                        <SheetTitle className="mb-4">Account</SheetTitle>
                        <div className="flex items-center gap-3">
                            <UserInfo user={user} showEmail />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1 p-3">
                        <Link
                            href={settingsIndex()}
                            className="flex items-center gap-3 rounded-md p-2.5 text-foreground hover:bg-sidebar-accent"
                            onClick={cleanup}
                        >
                            <Settings className="size-5 shrink-0" />
                            <span className="text-sm font-medium">
                                Settings
                            </span>
                        </Link>
                        <Link
                            href={logout()}
                            as="button"
                            className="flex w-full items-center gap-3 rounded-md p-2.5 text-foreground hover:bg-sidebar-accent"
                            onClick={handleLogout}
                            data-test="logout-button"
                        >
                            <LogOut className="size-5 shrink-0" />
                            <span className="text-sm font-medium">Log out</span>
                        </Link>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <DropdownMenu onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-64 rounded-xl p-1.5"
                align="end"
                side="right"
                sideOffset={8}
            >
                <UserMenuContent user={user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default AppAccountMenu;

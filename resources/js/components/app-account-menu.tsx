import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { cn } from '@/lib/utils';

type AppAccountMenuProps = {
    /**
     * When true, the user's display name is shown visibly next to the icon.
     * When false (default), the name is still present for accessibility
     * purposes but visually hidden via `sr-only`.
     */
    showLabel?: boolean;
};

/**
 * The account menu deliberately uses a menu icon rather than the user's
 * avatar: the navigation already shows the avatar on its Profile link, and
 * two avatars side by side read as a duplicated control.
 */
export function AppAccountMenu({ showLabel = false }: AppAccountMenuProps) {
    const { auth } = usePage().props;

    if (!auth.user) {
        return null;
    }

    const { user } = auth;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    data-test="app-account-menu-trigger"
                    className="flex w-full items-center gap-3 rounded-md p-2.5 text-foreground outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-sidebar-accent"
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
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 rounded-lg"
                align="center"
                side="top"
            >
                <UserMenuContent user={user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default AppAccountMenu;

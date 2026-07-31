import { Form, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function LogoutConfirmationDialog({
    open,
    onOpenChange,
}: Props) {
    const cleanup = useMobileNavigation();

    function handleLogout() {
        cleanup();
        router.flushAll();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-[60]">
                <DialogTitle>Log out?</DialogTitle>
                <DialogDescription>
                    Are you sure you want to log out of your account?
                </DialogDescription>

                <Form {...logout.form()} disableWhileProcessing>
                    {({ processing }) => (
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>

                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                                onClick={handleLogout}
                            >
                                {processing && <Spinner />}
                                Log out
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

import { Head, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { SettingsNav } from '@/components/settings-nav';
import { useIsMobile } from '@/hooks/use-mobile';
import { edit } from '@/routes/profile';

export default function SettingsIndex() {
    const isMobile = useIsMobile();

    useEffect(() => {
        if (!isMobile) {
            router.visit(edit(), { replace: true });
        }
    }, [isMobile]);

    if (!isMobile) {
        return null;
    }

    return (
        <div className="px-4 py-6 sm:px-6">
            <Head title="Settings" />
            <h1 className="mb-6 text-xl font-semibold tracking-tight text-foreground">
                Settings
            </h1>
            <SettingsNav />
        </div>
    );
}

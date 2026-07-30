import type { ReactNode } from 'react';
import AppNavDock from '@/components/app-nav-dock';
import AppNavRail from '@/components/app-nav-rail';

export default function AppShellLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <AppNavRail />

            <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col pb-16 md:pb-0 md:pl-[72px]">
                {children}
            </main>

            <AppNavDock />
        </div>
    );
}

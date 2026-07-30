import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { SettingsNav } from '@/components/settings-nav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { index as settingsIndex } from '@/routes/settings';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="px-4 py-6 sm:px-6 lg:py-10">
            <div className="mb-6 flex items-center gap-2 lg:hidden">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={settingsIndex()} aria-label="Back to settings">
                        <ArrowLeft />
                    </Link>
                </Button>
                <span className="font-semibold text-foreground">Settings</span>
            </div>

            <div className="hidden lg:block">
                <Heading
                    title="Settings"
                    description="Manage your profile and account settings"
                />
            </div>

            <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
                <aside className="hidden w-full lg:block">
                    <SettingsNav />
                </aside>

                <Card className="min-w-0 gap-0 border-0 bg-transparent py-0 shadow-none">
                    <section className="space-y-10">{children}</section>
                </Card>
            </div>
        </div>
    );
}

import { Head } from '@inertiajs/react';
import AppearanceTabs from '@/components/appearance-tabs';
import Heading from '@/components/heading';
import { Card, CardContent } from '@/components/ui/card';

export default function Appearance() {
    return (
        <>
            <Head title="Appearance settings" />

            <h1 className="sr-only">Appearance settings</h1>

            <div className="space-y-5">
                <Heading
                    variant="small"
                    title="Appearance"
                    description="Choose how the app looks on this device"
                />

                <section className="space-y-3">
                    <h2 className="text-sm font-semibold">Theme</h2>
                    <Card>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium">
                                    Colour mode
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Use your system preference or choose a
                                    theme.
                                </p>
                            </div>
                            <AppearanceTabs className="w-full sm:w-auto" />
                        </CardContent>
                    </Card>
                </section>
            </div>
        </>
    );
}

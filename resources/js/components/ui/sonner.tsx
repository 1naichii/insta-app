import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    CircleCheck,
    CircleX,
    Info,
    LoaderCircle,
    TriangleAlert,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();
    const isMobile = useIsMobile();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position={isMobile ? 'top-center' : 'bottom-right'}
            icons={{
                success: (
                    <CircleCheck className="size-4 text-green-600 dark:text-green-400" />
                ),
                info: (
                    <Info className="size-4 text-blue-600 dark:text-blue-400" />
                ),
                warning: (
                    <TriangleAlert className="size-4 text-amber-600 dark:text-amber-400" />
                ),
                error: (
                    <CircleX className="size-4 text-red-600 dark:text-red-400" />
                ),
                loading: (
                    <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                ),
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };

import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function EmptyState({
    title,
    description,
    icon: Icon = Inbox,
    action,
    className,
}: {
    title: string;
    description?: string;
    icon?: LucideIcon;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-10 text-center',
                className,
            )}
        >
            <Icon className="size-10 text-muted-foreground" />
            <h3 className="text-base font-medium">{title}</h3>
            {description && (
                <p className="max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}

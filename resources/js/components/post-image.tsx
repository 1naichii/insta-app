import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
    src: string;
    alt: string;
    className?: string;
    loading?: 'eager' | 'lazy';
};

export default function PostImage({ src, alt, className, loading }: Props) {
    const [failed, setFailed] = useState(false);

    // A post whose file has gone missing otherwise renders the browser's
    // broken-image glyph, which looks like a layout bug and says nothing.
    if (failed) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center bg-muted',
                    className,
                )}
            >
                <ImageOff
                    className="size-8 text-muted-foreground"
                    strokeWidth={1.5}
                    aria-hidden="true"
                />
                <span className="sr-only">{alt}. Photo unavailable.</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            loading={loading}
            className={className}
            onError={() => setFailed(true)}
        />
    );
}

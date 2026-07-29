import { Upload, X } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    ACCEPTED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_KB,
    createPreviewUrl,
    revokePreviewUrl,
    validateImage,
} from '@/lib/image';
import { cn } from '@/lib/utils';

type Props = {
    value: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    disabled?: boolean;
};

const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',');

const ACCEPTED_LABEL = ACCEPTED_IMAGE_TYPES.map((type) =>
    type.replace('image/', '').toUpperCase(),
).join(', ');

const MAX_SIZE_MB = MAX_IMAGE_SIZE_KB / 1024;

export default function ImageUpload({
    value,
    onChange,
    error,
    disabled = false,
}: Props) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [clientError, setClientError] = useState<string | null>(null);

    const preview = useMemo(
        () => (value ? createPreviewUrl(value) : null),
        [value],
    );

    useEffect(() => {
        if (!preview) {
            return;
        }

        return () => revokePreviewUrl(preview);
    }, [preview]);

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            setClientError(null);
            onChange(null);

            return;
        }

        const message = validateImage(file);
        setClientError(message);

        if (message) {
            onChange(null);

            if (inputRef.current) {
                inputRef.current.value = '';
            }

            return;
        }

        onChange(file);
    }

    function handleClear() {
        setClientError(null);
        onChange(null);

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }

    const displayedError = clientError ?? error;

    return (
        <div className="grid gap-2">
            <Label htmlFor={inputId}>Photo</Label>

            {preview ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                    <img
                        src={preview}
                        alt="Selected image preview"
                        className="aspect-square w-full max-w-full object-cover"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleClear}
                        disabled={disabled}
                        aria-label="Remove selected image"
                    >
                        <X />
                    </Button>
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    className={cn(
                        'flex aspect-square w-full max-w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors',
                        disabled
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer hover:bg-muted/70',
                    )}
                >
                    <Upload className="size-8" aria-hidden="true" />
                    <span className="text-sm font-medium">
                        Click to upload a photo
                    </span>
                </label>
            )}

            <input
                ref={inputRef}
                id={inputId}
                name="image"
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                required
                disabled={disabled}
                onChange={handleFileChange}
                aria-invalid={Boolean(displayedError)}
                className="sr-only"
            />

            <p className="text-xs text-muted-foreground">
                {ACCEPTED_LABEL} images up to {MAX_SIZE_MB}MB.
            </p>

            <InputError message={displayedError} />
        </div>
    );
}

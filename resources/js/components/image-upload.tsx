import { Upload, X } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import PostImage from '@/components/post-image';
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
    /** Form field name, which must match the backend validation rule. */
    name?: string;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    currentImageUrl?: string | null;
    displayName?: string;
};

const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',');

const ACCEPTED_LABEL = ACCEPTED_IMAGE_TYPES.map((type) =>
    type.replace('image/', '').toUpperCase(),
).join(', ');

const MAX_SIZE_MB = MAX_IMAGE_SIZE_KB / 1024;

export default function ImageUpload({
    value,
    onChange,
    name = 'image',
    error,
    disabled = false,
    required = true,
    currentImageUrl,
    displayName,
}: Props) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [clientError, setClientError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

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

    function acceptFile(file: File | null) {
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

    function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
        acceptFile(event.target.files?.[0] ?? null);
    }

    function handleDragOver(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setDragging(true);
    }

    function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setDragging(false);
    }

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setDragging(false);
        acceptFile(event.dataTransfer.files[0] ?? null);
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
        <div className={cn('grid', displayName ? 'gap-3' : 'gap-2')}>
            {displayName ? (
                <div className="flex items-center gap-4">
                    <div className="size-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                        {preview || currentImageUrl ? (
                            <img
                                src={preview ?? currentImageUrl ?? undefined}
                                alt={displayName}
                                className="size-full object-cover"
                            />
                        ) : (
                            <span className="flex size-full items-center justify-center text-xl font-semibold text-muted-foreground">
                                {displayName.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                            @{displayName}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => inputRef.current?.click()}
                                disabled={disabled}
                            >
                                Change photo
                            </Button>
                            {value && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClear}
                                    disabled={disabled}
                                >
                                    Remove selection
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <Label htmlFor={inputId}>Photo</Label>

                    {preview || currentImageUrl ? (
                        <div className="relative overflow-hidden rounded-lg border border-border">
                            <PostImage
                                src={preview ?? currentImageUrl ?? ''}
                                alt={
                                    preview
                                        ? 'Selected image preview'
                                        : 'Current post photo'
                                }
                                className="aspect-square w-full max-w-full object-cover"
                            />
                            {preview ? (
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
                            ) : (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => inputRef.current?.click()}
                                    disabled={disabled}
                                >
                                    Change photo
                                </Button>
                            )}
                        </div>
                    ) : (
                        <label
                            htmlFor={inputId}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                'flex aspect-square w-full max-w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors',
                                dragging && 'border-ring bg-muted/70',
                                disabled
                                    ? 'pointer-events-none opacity-50'
                                    : 'cursor-pointer hover:bg-muted/70',
                            )}
                        >
                            <Upload className="size-8" aria-hidden="true" />
                            <span className="text-sm font-medium">
                                Drag a photo here or click to upload
                            </span>
                        </label>
                    )}
                </>
            )}

            <input
                ref={inputRef}
                id={inputId}
                name={name}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                required={required}
                disabled={disabled}
                onChange={handleFileChange}
                aria-invalid={Boolean(displayedError)}
                aria-label={displayName ? 'Profile photo' : undefined}
                className="sr-only"
            />

            <p className="text-xs text-muted-foreground">
                {ACCEPTED_LABEL} images up to {MAX_SIZE_MB}MB.
            </p>

            <InputError message={displayedError} />
        </div>
    );
}

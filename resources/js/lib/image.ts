/** Maximum accepted image size, in kilobytes (mirrors the backend `max:5120` rule). */
export const MAX_IMAGE_SIZE_KB = 5120;

/** MIME types accepted for post images (mirrors the backend `mimes:jpg,jpeg,png,webp` rule). */
export const ACCEPTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
] as const;

/** Returns whether the file's MIME type is one of the accepted image types. */
export function validateImageType(file: File): boolean {
    return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

/** Returns whether the file's size is within the maximum allowed size. */
export function validateImageSize(file: File): boolean {
    return file.size <= MAX_IMAGE_SIZE_KB * 1024;
}

/**
 * Validates a file against the accepted image types and maximum size.
 * Returns a human-readable error message, or `null` when the file is
 * acceptable.
 */
export function validateImage(file: File): string | null {
    if (!validateImageType(file)) {
        return 'File must be a JPG, PNG, or WEBP image.';
    }

    if (!validateImageSize(file)) {
        return `Image must be smaller than ${MAX_IMAGE_SIZE_KB / 1024}MB.`;
    }

    return null;
}

/** Creates a temporary object URL that can be used to preview the file. */
export function createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
}

/** Revokes a preview URL created with `createPreviewUrl` to avoid leaking it. */
export function revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
}

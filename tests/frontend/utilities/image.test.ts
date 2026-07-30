import {
    MAX_IMAGE_SIZE_KB,
    createPreviewUrl,
    revokePreviewUrl,
    validateImage,
    validateImageSize,
    validateImageType,
} from '@/lib/image';

function imageFile(type = 'image/jpeg', size = 10): File {
    return new File([new Uint8Array(size)], 'photo.jpg', { type });
}

describe('image validation', () => {
    it('validates accepted image types', () => {
        expect(validateImageType(imageFile('image/jpeg'))).toBe(true);
        expect(validateImageType(imageFile('image/png'))).toBe(true);
        expect(validateImageType(imageFile('image/webp'))).toBe(true);
        expect(validateImageType(imageFile('image/gif'))).toBe(false);
    });

    it('validates the maximum image size', () => {
        expect(
            validateImageSize(
                imageFile('image/jpeg', MAX_IMAGE_SIZE_KB * 1024),
            ),
        ).toBe(true);
        expect(
            validateImageSize(
                imageFile('image/jpeg', MAX_IMAGE_SIZE_KB * 1024 + 1),
            ),
        ).toBe(false);
    });

    it('returns useful validation messages', () => {
        expect(validateImage(imageFile())).toBeNull();
        expect(validateImage(imageFile('image/gif'))).toBe(
            'File must be a JPG, PNG, or WEBP image.',
        );
        expect(
            validateImage(
                imageFile('image/jpeg', MAX_IMAGE_SIZE_KB * 1024 + 1),
            ),
        ).toBe('Image must be smaller than 5MB.');
    });
});

describe('preview URLs', () => {
    it('creates and revokes object URLs', () => {
        const file = imageFile();
        const createObjectURL = vi.fn(() => 'blob:preview');
        const revokeObjectURL = vi.fn();
        vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

        const url = createPreviewUrl(file);
        revokePreviewUrl(url);

        expect(createObjectURL).toHaveBeenCalledWith(file);
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
        vi.unstubAllGlobals();
    });
});

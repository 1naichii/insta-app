import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageUpload from '@/components/image-upload';

const createObjectURL = vi.fn(() => 'blob:preview');
const revokeObjectURL = vi.fn();

beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('ImageUpload', () => {
    it('accepts a valid image', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<ImageUpload value={null} onChange={onChange} />);
        const input = screen.getByLabelText('Photo');
        const file = new File(['image'], 'photo.png', { type: 'image/png' });

        await user.upload(input, file);

        expect(onChange).toHaveBeenCalledWith(file);
        expect(
            screen.getByText(/JPEG, PNG, WEBP images up to 5MB/i),
        ).toBeInTheDocument();
    });

    it('rejects an invalid image type and displays the error', async () => {
        const user = userEvent.setup({ applyAccept: false });
        const onChange = vi.fn();
        render(<ImageUpload value={null} onChange={onChange} />);

        await user.upload(
            screen.getByLabelText('Photo'),
            new File(['gif'], 'photo.gif', { type: 'image/gif' }),
        );

        expect(onChange).toHaveBeenCalledWith(null);
        expect(
            screen.getByText('File must be a JPG, PNG, or WEBP image.'),
        ).toBeInTheDocument();
    });

    it('previews and removes the selected image', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
        const { unmount } = render(
            <ImageUpload value={file} onChange={onChange} />,
        );

        expect(
            screen.getByRole('img', { name: /selected image preview/i }),
        ).toHaveAttribute('src', 'blob:preview');
        await user.click(
            screen.getByRole('button', { name: /remove selected image/i }),
        );

        expect(onChange).toHaveBeenCalledWith(null);
        unmount();
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    });

    it('disables file selection when requested', () => {
        render(<ImageUpload value={null} onChange={vi.fn()} disabled />);

        expect(screen.getByLabelText('Photo')).toBeDisabled();
    });
});

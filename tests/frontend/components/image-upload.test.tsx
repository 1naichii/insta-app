import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ImageUpload from '@/components/image-upload';

const createObjectURL = vi.fn(() => 'blob:preview');
const revokeObjectURL = vi.fn();
let transferredFiles: FileList;

class DataTransferStub {
    public readonly items = {
        add: vi.fn(),
    };

    public get files() {
        return transferredFiles;
    }
}

function allowFileListAssignment(input: HTMLInputElement) {
    let files = input.files;
    const emptyFiles = files;

    Object.defineProperties(input, {
        files: {
            configurable: true,
            get: () => files,
            set: (nextFiles: FileList) => {
                files = nextFiles;
            },
        },
        value: {
            configurable: true,
            get: () => (files?.length ? `C:\\fakepath\\${files[0].name}` : ''),
            set: (nextValue: string) => {
                if (nextValue === '') {
                    files = emptyFiles;
                }
            },
        },
    });
}

beforeEach(() => {
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    vi.stubGlobal('DataTransfer', DataTransferStub);
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

    it('attaches a valid dropped image to the form field', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const file = new File(['image'], 'photo.png', { type: 'image/png' });
        const transferInput = document.createElement('input');
        transferInput.type = 'file';
        await user.upload(transferInput, file);
        transferredFiles = transferInput.files!;

        function DropHarness() {
            const [value, setValue] = useState<File | null>(null);

            return (
                <form>
                    <ImageUpload
                        value={value}
                        onChange={(nextValue) => {
                            onChange(nextValue);
                            setValue(nextValue);
                        }}
                    />
                </form>
            );
        }

        render(<DropHarness />);
        const input = screen.getByLabelText('Photo') as HTMLInputElement;
        allowFileListAssignment(input);

        fireEvent.drop(
            screen.getByText(/drag a photo here/i).closest('label')!,
            { dataTransfer: { files: [file] } },
        );

        expect(onChange).toHaveBeenCalledWith(file);
        expect(input.files).toHaveLength(1);
        expect(input.files?.[0]).toBe(file);

        await user.click(
            screen.getByRole('button', { name: 'Remove selected image' }),
        );

        expect(input.files).toHaveLength(0);
        expect(
            screen.queryByRole('button', { name: 'Remove selected image' }),
        ).not.toBeInTheDocument();
    });

    it('rejects an invalid image dropped on the post dropzone', async () => {
        const user = userEvent.setup({ applyAccept: false });
        const onChange = vi.fn();
        const file = new File(['gif'], 'photo.gif', { type: 'image/gif' });
        const transferInput = document.createElement('input');
        transferInput.type = 'file';
        await user.upload(transferInput, file);
        transferredFiles = transferInput.files!;
        render(<ImageUpload value={null} onChange={onChange} />);
        allowFileListAssignment(
            screen.getByLabelText('Photo') as HTMLInputElement,
        );

        fireEvent.drop(
            screen.getByText(/drag a photo here/i).closest('label')!,
            { dataTransfer: { files: [file] } },
        );

        expect(onChange).toHaveBeenCalledWith(null);
        expect(
            screen.getByText('File must be a JPG, PNG, or WEBP image.'),
        ).toBeInTheDocument();
    });

    it('shows the current post photo with a change control', () => {
        render(
            <ImageUpload
                value={null}
                onChange={vi.fn()}
                currentImageUrl="/posts/current.jpg"
            />,
        );

        expect(
            screen.getByRole('img', { name: 'Current post photo' }),
        ).toHaveAttribute('src', '/posts/current.jpg');
        expect(
            screen.getByRole('button', { name: 'Change photo' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/drag a photo here/i),
        ).not.toBeInTheDocument();
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
        expect(createObjectURL).toHaveBeenCalledTimes(1);
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

    it('shows the current profile photo in the identity-card variant', () => {
        render(
            <ImageUpload
                value={null}
                onChange={vi.fn()}
                displayName="ada"
                currentImageUrl="/avatars/ada.jpg"
            />,
        );

        expect(screen.getByRole('img', { name: 'ada' })).toHaveAttribute(
            'src',
            '/avatars/ada.jpg',
        );
        expect(screen.getByText('@ada')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Change photo' }),
        ).toBeInTheDocument();
    });

    it('shows an initial and removes a profile photo selection', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
        render(
            <ImageUpload value={file} onChange={onChange} displayName="ada" />,
        );

        expect(screen.getByRole('img', { name: 'ada' })).toHaveAttribute(
            'src',
            'blob:preview',
        );

        await user.click(
            screen.getByRole('button', { name: 'Remove selection' }),
        );

        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('uses the display name initial when no profile photo exists', () => {
        render(
            <ImageUpload value={null} onChange={vi.fn()} displayName="ada" />,
        );

        expect(screen.getByText('A')).toBeInTheDocument();
    });
});

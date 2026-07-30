import { fireEvent, render, screen } from '@testing-library/react';
import PostImage from '@/components/post-image';

const src = 'https://example.test/sea.jpg';

describe('PostImage', () => {
    it('renders the photo with its source and alternative text', () => {
        render(<PostImage src={src} alt="A day by the sea" />);

        expect(
            screen.getByRole('img', { name: 'A day by the sea' }),
        ).toHaveAttribute('src', src);
        expect(screen.queryByText('Photo unavailable')).not.toBeInTheDocument();
    });

    it('defers loading only when asked to', () => {
        const { rerender } = render(<PostImage src={src} alt="Sea" />);

        expect(screen.getByRole('img', { name: 'Sea' })).not.toHaveAttribute(
            'loading',
        );

        rerender(<PostImage src={src} alt="Sea" loading="lazy" />);

        expect(screen.getByRole('img', { name: 'Sea' })).toHaveAttribute(
            'loading',
            'lazy',
        );
    });

    it('replaces a photo that fails to load with a placeholder', () => {
        render(
            <PostImage
                src={src}
                alt="A day by the sea"
                className="size-full object-cover"
            />,
        );

        fireEvent.error(screen.getByRole('img', { name: 'A day by the sea' }));

        expect(
            screen.queryByRole('img', { name: 'A day by the sea' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText('A day by the sea. Photo unavailable.'),
        ).toBeInTheDocument();
    });
});

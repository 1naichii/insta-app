import { render, screen } from '@testing-library/react';
import EmptyState from '@/components/empty-state';

describe('EmptyState', () => {
    it('renders its user-visible content and action', () => {
        render(
            <EmptyState
                title="Nothing here"
                description="Create the first item."
                action={<button>Create item</button>}
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Nothing here' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Create the first item.')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Create item' }),
        ).toBeInTheDocument();
    });

    it('omits optional content when it is not supplied', () => {
        render(<EmptyState title="Nothing here" />);

        expect(
            screen.queryByText('Create the first item.'),
        ).not.toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});

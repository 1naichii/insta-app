import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import CommentForm from '@/components/comment-form';

const formMock = vi.hoisted(() => ({
    errors: {} as Record<string, string>,
    processing: false,
    post: vi.fn(),
    reset: vi.fn(),
}));

vi.mock('@inertiajs/react', async () => {
    const React = await import('react');

    return {
        useForm: (initialData: { body: string }) => {
            const [data, setDataState] = React.useState(initialData);

            return {
                data,
                setData: (key: 'body', value: string) =>
                    setDataState((current) => ({ ...current, [key]: value })),
                post: formMock.post,
                processing: formMock.processing,
                errors: formMock.errors,
                reset: (key: 'body') => {
                    formMock.reset(key);
                    setDataState((current) => ({ ...current, [key]: '' }));
                },
            };
        },
    };
});

beforeEach(() => {
    formMock.errors = {};
    formMock.processing = false;
    formMock.post.mockReset();
    formMock.reset.mockReset();
});

describe('CommentForm', () => {
    it('renders a labelled textarea', () => {
        render(<CommentForm postId={1} />);

        expect(
            screen.getByRole('textbox', { name: /add a comment/i }),
        ).toBeInTheDocument();
    });

    it('prevents submitting an empty comment', async () => {
        const user = userEvent.setup();
        render(<CommentForm postId={1} />);

        await user.click(screen.getByRole('button', { name: /post comment/i }));

        expect(formMock.post).not.toHaveBeenCalled();
    });

    it('shows the validation message', () => {
        formMock.errors = { body: 'The comment field is required.' };
        render(<CommentForm postId={1} />);

        expect(
            screen.getByText('The comment field is required.'),
        ).toBeInTheDocument();
    });

    it('submits a valid comment and clears it after success', async () => {
        const user = userEvent.setup();
        render(<CommentForm postId={42} />);
        const textarea = screen.getByRole('textbox', {
            name: /add a comment/i,
        });

        await user.type(textarea, 'A thoughtful comment');
        await user.click(screen.getByRole('button', { name: /post comment/i }));

        expect(formMock.post).toHaveBeenCalledOnce();
        expect(formMock.post.mock.calls[0][0]).toContain('/posts/42/comments');

        const options = formMock.post.mock.calls[0][1] as {
            onSuccess: () => void;
        };
        act(() => options.onSuccess());

        expect(formMock.reset).toHaveBeenCalledWith('body');
        expect(textarea).toHaveValue('');
    });

    it('disables the textarea and submit button while processing', () => {
        formMock.processing = true;
        render(<CommentForm postId={1} />);

        expect(
            screen.getByRole('textbox', { name: /add a comment/i }),
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: /post comment/i }),
        ).toBeDisabled();
    });
});

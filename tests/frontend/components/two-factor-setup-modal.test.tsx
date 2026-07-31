import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';

const copy = vi.hoisted(() => vi.fn());

vi.mock('@inertiajs/react', () => ({
    Form: ({ children }: { children: (props: object) => ReactNode }) => (
        <form>{children({ processing: false })}</form>
    ),
}));

vi.mock('@/hooks/use-clipboard', async () => {
    const { useState } = await import('react');

    return {
        useClipboard: () => {
            const [copiedText, setCopiedText] = useState<string | null>(null);

            return [
                copiedText,
                async (text: string) => {
                    copy(text);
                    setCopiedText(text);

                    return true;
                },
            ] as const;
        },
    };
});

const setupKey = 'JBSWY3DPEHPK3PXP';

class ResizeObserverStub {
    disconnect = vi.fn();
    observe = vi.fn();
    unobserve = vi.fn();
}

function renderModal() {
    return render(
        <TwoFactorSetupModal
            isOpen
            onClose={vi.fn()}
            requiresConfirmation
            twoFactorEnabled={false}
            qrCodeSvg="<svg></svg>"
            manualSetupKey={setupKey}
            clearSetupData={vi.fn()}
            fetchSetupData={vi.fn().mockResolvedValue(undefined)}
            errors={[]}
        />,
    );
}

beforeEach(() => {
    copy.mockReset();
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

it('names the manual setup key input', () => {
    renderModal();

    expect(screen.getByRole('textbox', { name: 'Setup key' })).toHaveValue(
        setupKey,
    );
});

it('names the copy control and reports when the key is copied', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Copy setup key' }));

    expect(copy).toHaveBeenCalledWith(setupKey);
    expect(
        screen.getByRole('button', { name: 'Setup key copied' }),
    ).toBeInTheDocument();
});

it('marks the continue control as a non-submit button', () => {
    renderModal();

    expect(screen.getByRole('button', { name: 'Continue' })).toHaveAttribute(
        'type',
        'button',
    );
});

it('marks the copy control as a non-submit button', () => {
    renderModal();
    const setupKeyInput = screen.getByDisplayValue(setupKey);

    expect(
        setupKeyInput.parentElement?.querySelector('button'),
    ).toHaveAttribute('type', 'button');
});

it('clears the deferred OTP focus when verification unmounts', () => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const setTimeoutSpy = vi.spyOn(window, 'setTimeout');
    const { unmount } = renderModal();

    clearTimeoutSpy.mockClear();
    setTimeoutSpy.mockClear();
    act(() => screen.getByRole('button', { name: 'Continue' }).click());
    const focusTimeoutId = setTimeoutSpy.mock.results.at(-1)?.value;
    clearTimeoutSpy.mockClear();
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalledWith(focusTimeoutId);
});

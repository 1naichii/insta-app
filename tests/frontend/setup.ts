import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryList => {
        const target = new EventTarget();

        return {
            matches: false,
            media: query,
            onchange: null,
            addEventListener: target.addEventListener.bind(target),
            removeEventListener: target.removeEventListener.bind(target),
            addListener: (listener) =>
                target.addEventListener('change', listener as EventListener),
            removeListener: (listener) =>
                target.removeEventListener('change', listener as EventListener),
            dispatchEvent: target.dispatchEvent.bind(target),
        };
    },
});

afterEach(() => {
    cleanup();
});

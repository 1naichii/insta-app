import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" />
            <circle cx="12" cy="12" r="5" fill="none" />
            <circle cx="17.5" cy="6.5" r="0.75" fill="none" />
        </svg>
    );
}

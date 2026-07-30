import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    footer,
    children,
}: {
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            footer={footer}
        >
            {children}
        </AuthLayoutTemplate>
    );
}

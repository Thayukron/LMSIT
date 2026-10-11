import AppShell from '@/components/AppShell';

export default function Layout({ children }: LayoutProps<'/student'>) {
    return <AppShell>{children}</AppShell>;
}

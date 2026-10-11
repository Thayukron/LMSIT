import AppShell from '@/components/AppShell';

export default function Layout({ children }: LayoutProps<'/teacher'>) {
    return <AppShell>{children}</AppShell>;
}

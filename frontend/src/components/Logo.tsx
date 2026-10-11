import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { BRAND } from '@/lib/brand';

export default function Logo({ href = '/', light = false }: { href?: string; light?: boolean }) {
    return (
        <Link href={href} className="inline-flex items-center gap-2.5 shrink-0 group" aria-label={`${BRAND.name} หน้าแรก`}>
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 via-fuchsia-500 to-orange-400 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:rotate-6 transition-transform">
                <Sparkles size={18} className="text-white" />
            </span>
            <span className="leading-none">
                <span className={`block font-display font-bold text-lg ${light ? 'text-white' : 'text-ink'}`}>{BRAND.name}</span>
                <span className={`block text-[11px] font-medium ${light ? 'text-white/70' : 'text-slate-400'}`}>{BRAND.tagline}</span>
            </span>
        </Link>
    );
}

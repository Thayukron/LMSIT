// ชุดคอมโพเนนต์พื้นฐานของระบบ (ใช้ได้ทั้ง Server และ Client Component)
import React from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(' ');

// ---------- Button ----------
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'white';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonBase = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:opacity-50 disabled:pointer-events-none select-none';
const buttonVariants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-600 text-white shadow-[0_8px_20px_-8px_rgb(106_53_241/0.7)] hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300 hover:text-brand-700 shadow-soft',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    danger: 'bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50',
    white: 'bg-white text-brand-700 hover:bg-brand-50 shadow-lg',
};
const buttonSizes: Record<ButtonSize, string> = {
    sm: 'h-9 px-3.5 text-sm',
    md: 'h-11 px-5 text-sm',
    lg: 'h-13 px-7 text-base',
};

type ButtonProps = {
    variant?: ButtonVariant;
    size?: ButtonSize;
    href?: string;
    className?: string;
    children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>;

export function Button({ variant = 'primary', size = 'md', href, className, children, ...props }: ButtonProps) {
    const classes = cx(buttonBase, buttonVariants[variant], buttonSizes[size], className);
    if (href) return <Link href={href} className={classes} aria-label={props['aria-label']} title={props.title}>{children}</Link>;
    return <button type="button" className={classes} {...props}>{children}</button>;
}

// ---------- Card ----------
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cx('bg-white rounded-3xl ring-1 ring-slate-200/70 shadow-soft', className)} {...props}>{children}</div>;
}

// ---------- Badge ----------
type Tone = 'brand' | 'green' | 'amber' | 'red' | 'slate' | 'sky' | 'pink';
const toneClasses: Record<Tone, string> = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
    red: 'bg-red-50 text-red-700 ring-red-100',
    slate: 'bg-slate-100 text-slate-600 ring-slate-200',
    sky: 'bg-sky-50 text-sky-700 ring-sky-100',
    pink: 'bg-pink-50 text-pink-700 ring-pink-100',
};

export function Badge({ tone = 'slate', className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
    return (
        <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', toneClasses[tone], className)}>
            {children}
        </span>
    );
}

// ---------- Form ----------
export const inputClass = 'w-full rounded-xl bg-white px-4 py-3 text-[15px] ring-1 ring-slate-200 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50';

export function Field({ label, htmlFor, hint, children, aside }: {
    label: string; htmlFor?: string; hint?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-end justify-between gap-2 mb-1.5">
                <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700">{label}</label>
                {aside}
            </div>
            {children}
            {hint && <p className="text-xs text-slate-500 mt-1.5">{hint}</p>}
        </div>
    );
}

// ---------- Alert ----------
export function Alert({ tone = 'error', children, className }: { tone?: 'error' | 'success' | 'info' | 'warning'; children: React.ReactNode; className?: string }) {
    const styles = {
        error: ['bg-red-50 text-red-700 ring-red-100', AlertCircle],
        success: ['bg-emerald-50 text-emerald-700 ring-emerald-100', CheckCircle2],
        info: ['bg-brand-50 text-brand-800 ring-brand-100', Info],
        warning: ['bg-amber-50 text-amber-800 ring-amber-100', AlertCircle],
    } as const;
    const [cls, Icon] = styles[tone];
    return (
        <div role={tone === 'error' ? 'alert' : 'status'} className={cx('flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm ring-1 ring-inset', cls, className)}>
            <Icon size={18} className="shrink-0 mt-0.5" />
            <div className="min-w-0">{children}</div>
        </div>
    );
}

// ---------- Progress ----------
export function ProgressBar({ value, max, tone = 'brand', className, label }: {
    value: number; max: number; tone?: 'brand' | 'green'; className?: string; label?: string;
}) {
    const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className={cx('h-2 rounded-full bg-slate-100 overflow-hidden', className)} role="progressbar"
            aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
            <div className={cx('h-full rounded-full transition-all duration-700', tone === 'green' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-brand-500 to-fuchsia-500')}
                style={{ width: `${percent}%` }} />
        </div>
    );
}

// วงแหวนเปอร์เซ็นต์ (ใช้แสดงคะแนน/ความคืบหน้า)
export function ProgressRing({ percent, size = 120, stroke = 10, tone = 'brand', children }: {
    percent: number; size?: number; stroke?: number; tone?: 'brand' | 'green' | 'amber'; children?: React.ReactNode;
}) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const color = { brand: '#6a35f1', green: '#10b981', amber: '#f59e0b' }[tone];
    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ececf4" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
                    strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(100, Math.max(0, percent)) / 100)}
                    style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.7,0.2,1)' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
        </div>
    );
}

// ---------- Layout helpers ----------
export function PageHeader({ eyebrow, title, description, actions }: {
    eyebrow?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8 animate-fade-up">
            <div className="min-w-0">
                {eyebrow && <div className="mb-2 text-sm font-semibold text-brand-600">{eyebrow}</div>}
                <h1 className="text-3xl sm:text-4xl font-bold text-ink break-words">{title}</h1>
                {description && <p className="mt-2 text-slate-500 max-w-2xl">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
        </div>
    );
}

export function StatCard({ icon, label, value, hint, tone = 'brand' }: {
    icon: React.ReactNode; label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: 'brand' | 'green' | 'amber' | 'sky' | 'pink';
}) {
    const iconTone = {
        brand: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
        sky: 'bg-sky-50 text-sky-600', pink: 'bg-pink-50 text-pink-600',
    }[tone];
    return (
        <Card className="p-5 flex items-center gap-4">
            <div className={cx('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', iconTone)}>{icon}</div>
            <div className="min-w-0">
                <div className="text-sm text-slate-500">{label}</div>
                <div className="text-2xl font-bold font-display text-ink leading-tight">{value}</div>
                {hint && <div className="text-xs text-slate-400 mt-0.5">{hint}</div>}
            </div>
        </Card>
    );
}

export function EmptyState({ icon, title, description, action }: {
    icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center text-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 px-6 py-14">
            <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mb-4">{icon}</div>
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            {description && <p className="text-slate-500 mt-1 max-w-sm">{description}</p>}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

export function Spinner({ className }: { className?: string }) {
    return <div className={cx('w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin', className)} role="status" aria-label="กำลังโหลด" />;
}

export function PageLoader() {
    return (
        <div className="flex-1 flex items-center justify-center py-32">
            <Spinner />
        </div>
    );
}

export function Skeleton({ className }: { className?: string }) {
    return <div className={cx('skeleton rounded-2xl', className)} />;
}

export { cx };

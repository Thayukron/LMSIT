"use client";
import React, { useSyncExternalStore } from 'react';
import { Check } from 'lucide-react';
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, type ThemeId } from '@/lib/brand';
import { cx } from '@/components/ui';

// ธีมปัจจุบันอ่านจาก <html data-theme> (ตั้งค่าตั้งแต่โหลดหน้าโดยสคริปต์ใน layout.tsx)
const EVENT = 'lmsit-theme-change';
const subscribe = (cb: () => void) => { window.addEventListener(EVENT, cb); return () => window.removeEventListener(EVENT, cb); };
const getTheme = () => (document.documentElement.dataset.theme as ThemeId) || DEFAULT_THEME;

export function setTheme(id: ThemeId) {
    document.documentElement.dataset.theme = id;
    try { localStorage.setItem(THEME_STORAGE_KEY, id); } catch { /* เบราว์เซอร์ไม่อนุญาตให้บันทึก — ใช้ได้เฉพาะหน้านี้ */ }
    window.dispatchEvent(new Event(EVENT));
}

// ปุ่มเลือกธีมสี (วงกลมสี 6 ธีม) — จำค่าที่เลือกไว้ในเบราว์เซอร์นี้
export default function ThemePicker({ label = true, className }: { label?: boolean; className?: string }) {
    const current = useSyncExternalStore(subscribe, getTheme, () => DEFAULT_THEME);
    const currentName = THEMES.find(t => t.id === current)?.name;

    return (
        <div className={className}>
            {label && (
                <div className="flex items-baseline justify-between gap-2 mb-2">
                    <span className="text-xs font-semibold text-slate-500">ธีมสี</span>
                    <span className="text-xs text-slate-400 truncate">{currentName}</span>
                </div>
            )}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="ธีมสี">
                {THEMES.map(t => {
                    const active = t.id === current;
                    return (
                        <button key={t.id} type="button" role="radio" aria-checked={active} aria-label={t.name} title={t.name}
                            onClick={() => setTheme(t.id)}
                            className={cx('w-8 h-8 rounded-full flex items-center justify-center transition ring-offset-2',
                                active ? 'ring-2 ring-slate-400' : 'hover:scale-110')}
                            style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }}>
                            {active && <Check size={15} strokeWidth={3} className="text-white" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

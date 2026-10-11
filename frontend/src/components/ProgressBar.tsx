// แถบความคืบหน้า เช่น "ผ่าน 2 / 5 บท"
interface ProgressBarProps {
    value: number;
    max: number;
    label: string;
    tone?: 'indigo' | 'green';
}

export default function ProgressBar({ value, max, label, tone = 'green' }: ProgressBarProps) {
    const percent = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{label}</span>
                <span className="font-bold">{value} / {max}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar"
                aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
                <div className={`h-full transition-all ${tone === 'green' ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

const cls = 'w-full bg-surface border border-border px-3 py-3 text-sm focus:border-brand focus:outline-none';

export function Field({ label, value, onChange, type = 'text', required, multiline, placeholder, minLength }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
  multiline?: boolean; placeholder?: string; minLength?: number;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">{label}</span>
      {multiline
        ? <textarea value={value} rows={4} onChange={(e) => onChange(e.target.value)} className={cls} />
        : <input type={type} value={value} required={required} minLength={minLength} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </label>
  );
}

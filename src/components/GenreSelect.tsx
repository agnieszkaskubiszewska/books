// src/components/GenreSelect.tsx
import React from 'react';
type Option<T> = { value: T; label: string };

export function GenreSelect<T extends string>({
  value, onChange, options,
}: { value: T; onChange: (v: T)=>void; options: Option<T>[] }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div ref={ref} className="genre-custom">
      <button
        type="button"
        onClick={() => setOpen(o=>!o)}
        className={selected ? '' : 'placeholder'}
      >
{selected?.label ?? 'Kliknij by wybrać'}
      </button>
      {open && (
        <ul role="listbox">
          {options.map(o => (
            <li key={o.value} role="option" aria-selected={o.value===value}
                onClick={() => { onChange(o.value); setOpen(false); }}>
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
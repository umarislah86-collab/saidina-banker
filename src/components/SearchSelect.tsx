import { useState, useRef, useEffect } from 'react';

interface Item {
  id: string;
  label: string;
  sub?: string;
}

interface Props {
  items: Item[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}

export default function SearchSelect({ items, value, onChange, placeholder = 'Cari...' }: Props) {
  const selected = items.find(i => i.id === value);
  const [query, setQuery] = useState(selected?.label ?? '');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const sel = items.find(i => i.id === value);
    setQuery(sel?.label ?? '');
  }, [value, items]);

  const filtered = query.trim()
    ? items.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(''); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl max-h-52 overflow-y-auto">
          {filtered.map(item => (
            <button
              key={item.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(item.id); setQuery(item.label); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-700 transition-colors ${
                item.id === value ? 'bg-gray-700 text-amber-400' : 'text-white'
              }`}
            >
              <div>{item.label}</div>
              {item.sub && <div className="text-gray-500 text-xs">{item.sub}</div>}
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && query.trim() && (
        <div className="absolute z-50 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl p-3">
          <p className="text-gray-500 text-sm">Tiada hasil</p>
        </div>
      )}
    </div>
  );
}

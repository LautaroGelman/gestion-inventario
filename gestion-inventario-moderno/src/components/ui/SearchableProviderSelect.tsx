'use client';

import * as React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Option = { id: number; label: string };

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export default function SearchableProviderSelect({
                                                   options,
                                                   value,
                                                   onChange,
                                                   placeholder = '(opcional) Seleccioná proveedor',
                                                   disabled,
                                                   includeNoneOption = true,
                                                   allowClear = true,
                                                 }: {
  options: Option[];
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  includeNoneOption?: boolean;
  allowClear?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const current = React.useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value]
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? options.filter(o => o.label.toLowerCase().includes(q)) : options;
    return includeNoneOption ? [{ id: -1, label: '(Sin proveedor)' }, ...base] : base;
  }, [options, query, includeNoneOption]);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  React.useEffect(() => {
    // Resetea índice al cambiar el filtro
    setActiveIdx(0);
  }, [query]);

  const selectByIndex = (idx: number) => {
    const opt = filtered[idx];
    if (!opt) return;
    if (includeNoneOption && opt.id === -1) {
      onChange(null);
    } else {
      onChange(opt.id);
    }
    setOpen(false);
    setQuery('');
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectByIndex(activeIdx);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className={classNames(!current && 'text-muted-foreground')}>
              {current ? current.label : placeholder}
            </span>
            <span aria-hidden className="ml-2 opacity-60">▾</span>
          </Button>
        </PopoverTrigger>

        {allowClear && current && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="px-2"
            title="Quitar proveedor"
          >
            ✕
          </Button>
        )}
      </div>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-2">
        <div className="grid gap-2">
          <Input
            ref={inputRef}
            placeholder="Buscar proveedor…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="max-h-64 overflow-auto rounded-md border">
            {filtered.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">Sin resultados</div>
            )}
            <ul role="listbox">
              {filtered.map((opt, idx) => {
                const selected = current ? current.id === opt.id : false;
                const active = idx === activeIdx;
                return (
                  <li
                    key={`${opt.id}-${opt.label}`}
                    role="option"
                    aria-selected={selected}
                    className={classNames(
                      'cursor-pointer px-3 py-2 text-sm',
                      active && 'bg-muted',
                      selected && 'font-medium'
                    )}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => selectByIndex(idx)}
                  >
                    {opt.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

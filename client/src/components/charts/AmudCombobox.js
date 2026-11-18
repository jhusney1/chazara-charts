import React, { useMemo, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { AMUD_COUNT, amudChalakim, amudInfo, amudStart } from './data/mishnaBeruraAmudim';

// The full cycle is 1750 amudim; rendering every one on each keystroke makes
// the list sluggish, and nobody scrolls that far. Typing narrows it.
const MAX_SHOWN = 200;

const ALL_AMUDIM = Array.from({ length: AMUD_COUNT }, (_, i) => amudInfo(i + 1));

/**
 * Searchable amud picker for the Mishna Berura Amud Yomi mode.
 *
 * Each option shows the amud number and the siman:se'if it starts at,
 * grouped by chelek. Typing a number finds amudim with that number and the
 * amudim of that siman, so "143" offers both amud 143 and every amud of
 * siman 143. `min`/`max` bound the choices, which lets the ending picker
 * refuse amudim before the start.
 */
const AmudCombobox = ({ id, name, value, onChange, min = 1, max = AMUD_COUNT, labels }) => {
  const [query, setQuery] = useState('');
  const needle = query.trim();

  const { groups, hidden } = useMemo(() => {
    const inRange = ALL_AMUDIM.filter((entry) => entry.amud >= min && entry.amud <= max);
    const digits = needle.replace(/\D/g, '');
    const matches = digits
      ? inRange.filter((entry) => String(entry.amud).startsWith(digits) || String(entry.siman) === digits)
      : inRange;

    const shown = matches.slice(0, MAX_SHOWN);
    const byChelek = [];
    for (const entry of shown) {
      let chelek = byChelek[byChelek.length - 1];
      if (!chelek || chelek.name !== entry.chelek) {
        chelek = { name: entry.chelek, amudim: [] };
        byChelek.push(chelek);
      }
      chelek.amudim.push(entry);
    }
    return { groups: byChelek, hidden: matches.length - shown.length };
  }, [needle, min, max]);

  const display = (amud) => {
    const info = amudInfo(amud);
    return info ? `${labels.amud} ${amud} · ${labels.siman} ${amudStart(amud)} (${info.chelek})` : '';
  };

  return (
    <Combobox value={value} onChange={(amud) => amud && onChange(amud)}>
      <div className="relative">
        <Combobox.Input
          id={id}
          name={name}
          required
          autoComplete="off"
          inputMode="numeric"
          placeholder={labels.searchAmud}
          displayValue={display}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        <Combobox.Options className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-lg bg-white text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {groups.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">{labels.noAmudMatches}</div>
          ) : (
            groups.map((chelek) => {
              const range = amudChalakim.find((c) => c.chelek === chelek.name);
              return (
                <div key={chelek.name}>
                  <div className="sticky top-0 z-10 flex justify-between bg-emerald-700 text-white font-semibold px-3 py-1.5 text-xs uppercase tracking-wide">
                    <span>{chelek.name}</span>
                    {range && (
                      <span className="tabular-nums font-normal normal-case">
                        {labels.amud} {range.start}-{range.end}
                      </span>
                    )}
                  </div>
                  {chelek.amudim.map((entry) => (
                    <Combobox.Option
                      key={entry.amud}
                      value={entry.amud}
                      className={({ active, selected }) =>
                        `flex cursor-pointer select-none items-baseline justify-between gap-3 px-3 py-1.5 ${
                          selected
                            ? 'bg-emerald-600 text-white font-semibold'
                            : active
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'text-gray-800'
                        }`
                      }
                    >
                      <span className="tabular-nums">
                        {labels.amud} {entry.amud}
                      </span>
                      <span className="tabular-nums text-xs opacity-80">
                        {labels.siman} {amudStart(entry.amud)}
                      </span>
                    </Combobox.Option>
                  ))}
                </div>
              );
            })
          )}
          {hidden > 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
              {labels.moreAmudim.replace('{count}', hidden)}
            </div>
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

export default AmudCombobox;

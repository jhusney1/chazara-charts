import React, { useMemo, useState } from 'react';
import { Combobox } from '@headlessui/react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { simanIndex, simanInfo } from './data/mishnaBeruraData';

/**
 * Searchable siman picker for the Mishna Berura form.
 *
 * The list shows every siman grouped by chelek and topic, so the user can see
 * which book and which halachos a siman belongs to before choosing it.
 * Typing a number narrows to simanim starting with those digits; typing text
 * narrows to topics (English or Hebrew) or a chelek. `min`/`max` bound the
 * choices, which lets the ending picker refuse simanim before the start.
 */
const SimanCombobox = ({ id, name, value, onChange, min = 1, max = 697, labels }) => {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const groups = useMemo(() => {
    const inRange = simanIndex.filter((entry) => entry.siman >= min && entry.siman <= max);
    let matches = inRange;
    if (/^\d+$/.test(needle)) {
      matches = inRange.filter((entry) => String(entry.siman).startsWith(needle));
    } else if (needle) {
      matches = inRange.filter(
        (entry) =>
          entry.topic.toLowerCase().includes(needle) ||
          entry.heName.includes(needle) ||
          entry.chelek.toLowerCase().includes(needle)
      );
    }

    // Nest matches as chelek -> topic -> simanim, keeping source order.
    const byChelek = [];
    for (const entry of matches) {
      let chelek = byChelek[byChelek.length - 1];
      if (!chelek || chelek.name !== entry.chelek) {
        chelek = { name: entry.chelek, topics: [] };
        byChelek.push(chelek);
      }
      let topic = chelek.topics[chelek.topics.length - 1];
      if (!topic || topic.name !== entry.topic) {
        topic = { name: entry.topic, heName: entry.heName, simanim: [] };
        chelek.topics.push(topic);
      }
      topic.simanim.push(entry.siman);
    }
    return byChelek;
  }, [needle, min, max]);

  const display = (siman) => {
    const info = simanInfo(siman);
    return info ? `${labels.siman} ${siman} · ${info.topic} (${info.chelek})` : '';
  };

  return (
    <Combobox value={value} onChange={(siman) => siman && onChange(siman)}>
      <div className="relative">
        <Combobox.Input
          id={id}
          name={name}
          required
          autoComplete="off"
          placeholder={labels.searchSiman}
          displayValue={display}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        <Combobox.Options className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-lg bg-white text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {groups.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">{labels.noSimanMatches}</div>
          ) : (
            groups.map((chelek) => (
              <div key={chelek.name}>
                <div className="sticky top-0 z-10 bg-emerald-700 text-white font-semibold px-3 py-1.5 text-xs uppercase tracking-wide">
                  {chelek.name}
                </div>
                {chelek.topics.map((topic) => (
                  <div key={topic.name} className="border-b border-gray-100 last:border-b-0">
                    <div className="flex items-baseline justify-between gap-2 px-3 pt-2 pb-1 text-gray-800">
                      <span className="font-medium">{topic.name}</span>
                      <span className="hebrew text-gray-500 text-xs whitespace-nowrap">{topic.heName}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 px-3 pb-2">
                      {topic.simanim.map((siman) => (
                        <Combobox.Option
                          key={siman}
                          value={siman}
                          className={({ active, selected }) =>
                            `cursor-pointer select-none rounded px-2 py-0.5 text-xs tabular-nums border ${
                              selected
                                ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                                : active
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-emerald-50'
                            }`
                          }
                        >
                          {siman}
                        </Combobox.Option>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

export default SimanCombobox;

import React, { useState } from 'react';
import { Combobox } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';

/**
 * Searchable masechet picker.
 *
 * Typing filters the tractate list by a case-insensitive substring match;
 * choosing an entry calls `onChange` with the tractate name, exactly as the
 * old <select> did. The input carries the field name and `required`, so the
 * form still refuses to submit without a masechet.
 */
const MasechetCombobox = ({ id, name, value, onChange, tractateData, labels }) => {
  const [query, setQuery] = useState('');

  const tractates = Object.keys(tractateData);
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? tractates.filter((tractate) => tractate.toLowerCase().includes(needle))
    : tractates;

  return (
    <Combobox value={value} onChange={onChange} nullable>
      <div className="relative">
        <Combobox.Input
          id={id}
          name={name}
          required
          autoComplete="off"
          placeholder={labels.searchMasechet}
          displayValue={(tractate) => (tractate ? `${tractate} (${tractateData[tractate]} daf)` : '')}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>

        <Combobox.Options className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          {matches.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">{labels.noMasechetMatches}</div>
          ) : (
            matches.map((tractate) => (
              <Combobox.Option
                key={tractate}
                value={tractate}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                  }`
                }
              >
                {({ selected, active }) => (
                  <>
                    <span className={selected ? 'font-semibold' : 'font-normal'}>
                      {tractate}{' '}
                      <span className={active ? 'text-indigo-100' : 'text-gray-500'}>
                        ({tractateData[tractate]} daf)
                      </span>
                    </span>
                    {selected && (
                      <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-indigo-600'}`}>
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </Combobox.Option>
            ))
          )}
        </Combobox.Options>
      </div>
    </Combobox>
  );
};

export default MasechetCombobox;

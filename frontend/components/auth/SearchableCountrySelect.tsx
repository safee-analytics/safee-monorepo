"use client";

import React, { useState, useRef, useEffect } from "react";
import { getCountries, getCountryCallingCode } from "react-phone-number-input/input";
import type { Country } from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";

interface SearchableCountrySelectProps {
  value?: Country;
  onChange: (value: Country) => void;
  labels?: Record<string, string>;
}

export function SearchableCountrySelect({ value, onChange, labels = en }: SearchableCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const countries = getCountries();

  const filteredCountries = countries.filter((country) => {
    const countryName = labels[country] || country;
    const callingCode = getCountryCallingCode(country);
    const query = searchQuery.toLowerCase();

    return (
      countryName.toLowerCase().includes(query) ||
      country.toLowerCase().includes(query) ||
      `+${callingCode}`.includes(query)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      searchInputRef.current?.focus();
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedCallingCode = value ? `+${getCountryCallingCode(value)}` : "";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 border-r border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-safee-500 transition-colors"
      >
        {value && <span className="text-xl">{getFlagEmoji(value)}</span>}
        <span className="text-sm font-medium text-gray-700">{selectedCallingCode || "+"}</span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-xl">
          <div className="p-2 border-b border-gray-200">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-safee-500"
            />
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const countryName = labels[country] || country;
                const callingCode = getCountryCallingCode(country);
                const isSelected = country === value;

                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      onChange(country);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left ${
                      isSelected ? "bg-safee-50" : ""
                    }`}
                  >
                    <span className="text-xl">{getFlagEmoji(country)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{countryName}</div>
                      <div className="text-xs text-gray-500">+{callingCode}</div>
                    </div>
                    {isSelected && (
                      <svg
                        className="w-5 h-5 text-safee-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-sm text-gray-500">No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

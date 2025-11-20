"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type DocumentStatus = "pending" | "under-review" | "approved" | "rejected";

interface InlineDocumentStatusProps {
  documentId: string;
  currentStatus: DocumentStatus;
  onUpdate?: (documentId: string, newStatus: DocumentStatus) => void;
}

const statuses: { value: DocumentStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-gray-100 text-gray-700" },
  { value: "under-review", label: "Under Review", color: "bg-yellow-100 text-yellow-700" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-700" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
];

export function InlineDocumentStatus({ documentId, currentStatus, onUpdate }: InlineDocumentStatusProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleStatusChange = async (newStatus: DocumentStatus) => {
    setStatus(newStatus);
    setIsOpen(false);

    if (onUpdate) {
      onUpdate(documentId, newStatus);
    }
  };

  const currentStatusObj = statuses.find((s) => s.value === status);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-1 hover:opacity-80 transition-opacity"
      >
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentStatusObj?.color}`}>
          {currentStatusObj?.label}
        </span>
        <ChevronDown className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>

      {isOpen && (
        <div
          className="fixed z-[9999] mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-fit"
          style={{
            top: dropdownRef.current?.getBoundingClientRect().bottom ?? 0,
            left: dropdownRef.current?.getBoundingClientRect().left ?? 0,
          }}
        >
          {statuses
            .filter((s) => s.value !== status)
            .map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusChange(s.value)}
                className="px-2 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors whitespace-nowrap w-full"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

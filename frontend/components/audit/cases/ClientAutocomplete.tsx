"use client";

import { useState, useRef, useEffect, startTransition } from "react";
import { Search, Clock, TrendingUp, Copy } from "lucide-react";
import { useAutofill, type AutofillClientHistory } from "@/lib/hooks/useAutofill";
import { formatDistanceToNow } from "date-fns";
import { type Case } from "@/lib/validation";

interface ClientAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onClientSelect?: (clientHistory: AutofillClientHistory) => void;
  placeholder?: string;
  className?: string;
}

interface ClientFromRecent {
  name: string;
  lastCase: Case;
  count: number;
}

export function ClientAutocomplete({
  value,
  onChange,
  onClientSelect,
  placeholder = "Enter client or company name",
  className = "",
}: ClientAutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getRecentClients, getClientHistory } = useAutofill();
  const recentClients = getRecentClients();

  // Filter clients based on input
  const filteredClients =
    value.length > 0
      ? recentClients.filter((client) => client.name.toLowerCase().includes(value.toLowerCase()))
      : recentClients;

  // Show suggestions when focused and have matches
  useEffect(() => {
    startTransition(() => {
      setShowSuggestions(isFocused && filteredClients.length > 0);
    });
  }, [isFocused, filteredClients.length]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClientClick = (clientName: string) => {
    onChange(clientName);
    setShowSuggestions(false);

    // Trigger callback with client history for autofill
    if (onClientSelect) {
      const history = getClientHistory(clientName);
      onClientSelect(history);
    }
  };

  const handleCopyFromLast = (client: ClientFromRecent) => {
    onChange(client.name);
    setShowSuggestions(false);

    if (onClientSelect) {
      const history = getClientHistory(client.name);
      onClientSelect(history);
    }
  };

  const getAuditTypeLabel = (auditType: string) => {
    const labels: Record<string, string> = {
      financial_audit: "Financial",
      compliance_audit: "Compliance",
      icv_audit: "ICV",
      operational_audit: "Operational",
      it_audit: "IT",
      general_audit: "General",
    };
    return labels[auditType] || auditType;
  };

  return (
    <div className="relative">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onFocus={() => {
            setIsFocused(true);
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          autoComplete="off"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {filteredClients.length > 0 ? (
            <div className="py-2">
              {/* Header */}
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {value.length > 0 ? "Matching Clients" : "Recent Clients"}
                </p>
              </div>

              {/* Client List */}
              {filteredClients.map((client, index) => (
                <div key={`${client.name}-${index}`} className="group hover:bg-blue-50 transition-colors">
                  <button
                    onClick={() => {
                      handleClientClick(client.name);
                    }}
                    className="w-full px-4 py-3 text-left flex items-start justify-between"
                  >
                    <div className="flex-1">
                      {/* Client Name */}
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium text-gray-900">{client.name}</p>
                        {client.count > 1 && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            {client.count} cases
                          </span>
                        )}
                      </div>

                      {/* Last Case Info */}
                      <div className="flex items-center space-x-4 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(client.lastCase.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{getAuditTypeLabel(client.lastCase.caseType)}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                          {client.lastCase.status}
                        </span>
                      </div>
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyFromLast(client);
                      }}
                      className="ml-4 p-2 opacity-0 group-hover:opacity-100 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
                      title="Use details from last case"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </button>

                  {/* Divider */}
                  {index < filteredClients.length - 1 && <div className="mx-4 border-b border-gray-100" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No matching clients found</p>
              <p className="text-xs mt-1">Type to create a new client entry</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
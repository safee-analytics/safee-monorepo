"use client";

import { useState } from "react";
import { Button } from "@safee/ui";
import { Plus, X } from "lucide-react";
import type { CustomField } from "./ProcedureRequirementsEditor";

interface CustomFieldBuilderProps {
  onAddField: (field: CustomField) => void;
}

type FieldType = "text" | "number" | "date" | "select" | "textarea" | "checkbox" | "file";

const FIELD_TYPES: { value: FieldType; label: string; description: string }[] = [
  { value: "text", label: "Text", description: "Single line text input" },
  { value: "textarea", label: "Textarea", description: "Multi-line text input" },
  { value: "number", label: "Number", description: "Numeric input" },
  { value: "date", label: "Date", description: "Date picker" },
  { value: "select", label: "Select", description: "Dropdown selection" },
  { value: "checkbox", label: "Checkbox", description: "Yes/No checkbox" },
  { value: "file", label: "File", description: "File upload" },
];

export function CustomFieldBuilder({ onAddField }: CustomFieldBuilderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [fieldName, setFieldName] = useState("");
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldDescription, setFieldDescription] = useState("");
  const [isRequired, setIsRequired] = useState(false);

  // Type-specific fields
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  // Validation
  const [minValue, setMinValue] = useState<number | undefined>();
  const [maxValue, setMaxValue] = useState<number | undefined>();
  const [minLength, setMinLength] = useState<number | undefined>();
  const [maxLength, setMaxLength] = useState<number | undefined>();

  const resetForm = () => {
    setFieldType("text");
    setFieldName("");
    setFieldLabel("");
    setFieldDescription("");
    setIsRequired(false);
    setOptions([]);
    setOptionInput("");
    setMinValue(undefined);
    setMaxValue(undefined);
    setMinLength(undefined);
    setMaxLength(undefined);
  };

  const handleAddOption = () => {
    if (optionInput.trim() && !options.includes(optionInput.trim())) {
      setOptions([...options, optionInput.trim()]);
      setOptionInput("");
    }
  };

  const handleRemoveOption = (option: string) => {
    setOptions(options.filter((o) => o !== option));
  };

  const handleAddField = () => {
    if (!fieldName.trim() || !fieldLabel.trim()) {
      return;
    }

    const field: CustomField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: fieldName.trim(),
      type: fieldType,
      label: fieldLabel.trim(),
      description: fieldDescription.trim() || undefined,
      required: isRequired,
    };

    // Add options for select fields
    if (fieldType === "select" && options.length > 0) {
      field.options = options;
    }

    // Add validation rules
    const validation: CustomField["validation"] = {};
    if (minValue !== undefined) validation.min = minValue;
    if (maxValue !== undefined) validation.max = maxValue;
    if (minLength !== undefined) validation.minLength = minLength;
    if (maxLength !== undefined) validation.maxLength = maxLength;

    if (Object.keys(validation).length > 0) {
      field.validation = validation;
    }

    onAddField(field);
    resetForm();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Custom Field
      </Button>
    );
  }

  return (
    <div className="border border-gray-300 rounded-lg p-4 space-y-4 bg-blue-50">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">New Custom Field</h4>
        <button
          onClick={() => {
            resetForm();
            setIsOpen(false);
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Field Name (internal) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Name (Internal) *
          </label>
          <input
            type="text"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            placeholder="e.g., risk_level"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Used for data storage (no spaces)</p>
        </div>

        {/* Field Label (display) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Label (Display) *
          </label>
          <input
            type="text"
            value={fieldLabel}
            onChange={(e) => setFieldLabel(e.target.value)}
            placeholder="e.g., Risk Level"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Shown to users</p>
        </div>

        {/* Field Type */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Field Type *</label>
          <div className="grid grid-cols-4 gap-2">
            {FIELD_TYPES.map((type) => (
              <label
                key={type.value}
                className={`flex flex-col p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  fieldType === type.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="fieldType"
                  value={type.value}
                  checked={fieldType === type.value}
                  onChange={(e) => setFieldType(e.target.value as FieldType)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900">{type.label}</span>
                <span className="text-xs text-gray-500 mt-1">{type.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={fieldDescription}
            onChange={(e) => setFieldDescription(e.target.value)}
            rows={2}
            placeholder="Optional help text for this field"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Required checkbox */}
        <div className="col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={(e) => setIsRequired(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Required field (user must provide a value)
            </span>
          </label>
        </div>

        {/* Type-specific options */}
        {fieldType === "select" && (
          <div className="col-span-2 space-y-2">
            <label className="block text-sm font-medium text-gray-700">Options *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
                placeholder="Add option..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button type="button" size="sm" onClick={handleAddOption}>
                Add
              </Button>
            </div>
            {options.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {options.map((option) => (
                  <span
                    key={option}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
                  >
                    {option}
                    <button
                      onClick={() => handleRemoveOption(option)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Number validation */}
        {(fieldType === "number" || fieldType === "date") && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Value
              </label>
              <input
                type="number"
                value={minValue ?? ""}
                onChange={(e) =>
                  setMinValue(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Value
              </label>
              <input
                type="number"
                value={maxValue ?? ""}
                onChange={(e) =>
                  setMaxValue(e.target.value ? parseFloat(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Text/Textarea validation */}
        {(fieldType === "text" || fieldType === "textarea") && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Length
              </label>
              <input
                type="number"
                value={minLength ?? ""}
                onChange={(e) =>
                  setMinLength(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Length
              </label>
              <input
                type="number"
                value={maxLength ?? ""}
                onChange={(e) =>
                  setMaxLength(e.target.value ? parseInt(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            resetForm();
            setIsOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleAddField}
          disabled={!fieldName.trim() || !fieldLabel.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      </div>
    </div>
  );
}

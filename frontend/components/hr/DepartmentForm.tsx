"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDepartments } from "@/lib/api/hooks/hrManagement";
import { Button } from "@safee/ui";
import { type DepartmentDbResponse, departmentDbResponseSchema } from "@/lib/validation";

// Zod schema for department form validation
const departmentFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().optional(),
  parentId: z.string().optional(),
  color: z.string().optional(),
  note: z.string().optional(),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;

interface DepartmentFormProps {
  defaultValues?: Partial<DepartmentDbResponse>;
  onSubmit: (data: DepartmentFormValues) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function DepartmentForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Department",
}: DepartmentFormProps) {
  const { data: departments } = useDepartments();

  // Filter out current department and its children to prevent circular references
  const availableParents = departments?.filter(
    (dept) => dept.id !== defaultValues?.id && dept.parentId !== defaultValues?.id,
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      code: defaultValues?.code || "",
      parentId: defaultValues?.parentId || "",
      color: defaultValues?.color?.toString() || "",
      note: defaultValues?.note || "",
    },
  });

  // Use useWatch instead of watch for better React 19 compatibility
  const colorValue = useWatch({ control, name: "color" });

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit((data) => {
          void onSubmit(data);
        })(event);
      }}
      className="space-y-8"
    >
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Department Code
            </label>
            <input
              id="code"
              type="text"
              {...register("code")}
              placeholder="e.g., ENG, HR, SALES"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
              Parent Department
            </label>
            <select
              id="parentId"
              {...register("parentId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">None (Top Level)</option>
              {availableParents?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">Select a parent to create a sub-department</p>
          </div>

          <div>
            <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
              Color (Hex Code)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="color"
                type="text"
                {...register("color")}
                placeholder="3b82f6"
                maxLength={6}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="color"
                value={`#${colorValue || "3b82f6"}`}
                onChange={(e) => {
                  const hex = e.target.value.replace("#", "");
                  const colorInput = document.getElementById("color");
                  if (colorInput instanceof HTMLInputElement) colorInput.value = hex;
                }}
                className="w-12 h-10 rounded-lg border border-gray-300 cursor-pointer"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">Enter color without # (e.g., 3b82f6)</p>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="note"
            {...register("note")}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.history.back();
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
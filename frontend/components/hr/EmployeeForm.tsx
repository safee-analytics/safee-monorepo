"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDepartments } from "@/lib/api/hooks/hrManagement";
import { Button } from "@safee/ui";
import { type EmployeeDbResponse, employeeDbResponseSchema } from "@/lib/validation";

// Zod schema for employee form validation
const employeeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  workEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  mobile: z.string().optional(),
  workPhone: z.string().optional(),
  workLocation: z.string().optional(),
  identificationId: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  birthday: z.string().optional(),
  countryOfBirth: z.string().optional(),
  maritalStatus: z.enum(["single", "married", "cohabitant", "widower", "divorced"]).optional(),
  employeeType: z.enum(["employee", "student", "trainee", "contractor", "freelance"]).optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  notes: z.string().optional(),
  active: z.boolean().default(true),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeDbResponse>;
  onSubmit: (data: EmployeeFormValues) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function EmployeeForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Employee",
}: EmployeeFormProps) {
  const { data: departments } = useDepartments();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      workEmail: defaultValues?.workEmail || "",
      jobTitle: defaultValues?.jobTitle || "",
      departmentId: defaultValues?.departmentId || "",
      managerId: defaultValues?.managerId || "",
      mobile: defaultValues?.mobile || "",
      workPhone: defaultValues?.workPhone || "",
      workLocation: defaultValues?.workLocation || "",
      identificationId: defaultValues?.identificationId || "",
      gender: defaultValues?.gender || undefined,
      birthday: defaultValues?.birthday || "",
      countryOfBirth: defaultValues?.countryOfBirth || "",
      maritalStatus: defaultValues?.maritalStatus || undefined,
      employeeType: defaultValues?.employeeType || undefined,
      email: defaultValues?.email || "",
      emergencyContact: defaultValues?.emergencyContact || "",
      emergencyPhone: defaultValues?.emergencyPhone || "",
      notes: defaultValues?.notes || "",
      active: defaultValues?.active ?? true,
    },
  });

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
              Full Name <span className="text-red-500">*</span>
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
            <label htmlFor="identificationId" className="block text-sm font-medium text-gray-700 mb-1">
              ID Number
            </label>
            <input
              id="identificationId"
              type="text"
              {...register("identificationId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender
            </label>
            <select
              id="gender"
              {...register("gender")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-1">
              Birthday
            </label>
            <input
              id="birthday"
              type="date"
              {...register("birthday")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Marital Status
            </label>
            <select
              id="maritalStatus"
              {...register("maritalStatus")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="cohabitant">Cohabitant</option>
              <option value="widower">Widower</option>
              <option value="divorced">Divorced</option>
            </select>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              id="country"
              type="text"
              {...register("countryOfBirth")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Work Information */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Job Title
            </label>
            <input
              id="jobTitle"
              type="text"
              {...register("jobTitle")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              id="departmentId"
              {...register("departmentId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select department</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="employeeType" className="block text-sm font-medium text-gray-700 mb-1">
              Employee Type
            </label>
            <select
              id="employeeType"
              {...register("employeeType")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select type</option>
              <option value="employee">Employee</option>
              <option value="student">Student</option>
              <option value="trainee">Trainee</option>
              <option value="contractor">Contractor</option>
              <option value="freelance">Freelance</option>
            </select>
          </div>

          <div>
            <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Work Location
            </label>
            <input
              id="workLocation"
              type="text"
              {...register("workLocation")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="managerId" className="block text-sm font-medium text-gray-700 mb-1">
              Manager (Employee ID)
            </label>
            <input
              id="managerId"
              type="text"
              {...register("managerId")}
              placeholder="Enter manager's employee ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">Enter the employee ID of this person&apos;s manager</p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="workEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Work Email
            </label>
            <input
              id="workEmail"
              type="email"
              {...register("workEmail")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.workEmail && <p className="mt-1 text-sm text-red-600">{errors.workEmail.message}</p>}
          </div>

          <div>
            <label htmlFor="privateEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Personal Email
            </label>
            <input
              id="privateEmail"
              type="email"
              {...register("email")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Phone
            </label>
            <input
              id="mobilePhone"
              type="tel"
              {...register("mobile")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="workPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Work Phone
            </label>
            <input
              id="workPhone"
              type="tel"
              {...register("workPhone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <input
              id="emergencyContact"
              type="text"
              {...register("emergencyContact")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <input
              id="emergencyPhone"
              type="tel"
              {...register("emergencyPhone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              {...register("notes")}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="active"
              type="checkbox"
              {...register("active")}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Active Employee
            </label>
          </div>
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

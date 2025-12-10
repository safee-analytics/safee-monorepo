"use client";

import { useState, useEffect } from "react";
import {
  useActiveOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
  useIsOrganizationOwner,
} from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/hooks";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { LogoUpload } from "@/components/common";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Trash2,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Settings,
  AlertTriangle,
  ArrowRightLeft,
  Save,
  X,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

interface OrganizationSettings {
  // Company Info
  name: string;
  logo?: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;

  // Legal Info
  legalName?: string;
  businessNumber?: string;
  gstNumber?: string;
  businessType?: string;
  legalAddress?: string;

  // Customer Contact
  customerEmail?: string;
  customerAddress?: string;

  // Preferences
  fiscalYearStart?: string;
  currency?: string;
  dateFormat?: string;
  language?: string;
}

export default function OrganizationSettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: organization } = useActiveOrganization();
  const { user } = useAuth();
  const updateOrganizationMutation = useUpdateOrganization();
  const deleteOrganizationMutation = useDeleteOrganization();
  const isOwner = useIsOrganizationOwner();

  // All hooks must be called before any conditional returns
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [settings, setSettings] = useState<OrganizationSettings>({
    name: organization?.name || "",
    logo: undefined,
    address: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    legalName: organization?.name || "",
    businessNumber: "",
    gstNumber: "",
    businessType: "",
    legalAddress: "",
    customerEmail: "",
    customerAddress: "",
    fiscalYearStart: "January",
    currency: "QAR",
    dateFormat: "dd/mm/yyyy",
    language: "en",
  });

  // Auto-fill from user data when available
  useEffect(() => {
    if (user && organization) {
      setSettings((prev) => ({
        ...prev,
        name: organization.name || prev.name,
        email: prev.email || user.email || "",
        customerEmail: prev.customerEmail || user.email || "",
        legalName: prev.legalName || organization.name || "",
      }));
    }
  }, [user, organization]);

  // Owner-only access - check after all hooks are called
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg border border-red-200 p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Owner Access Only</h2>
          <p className="text-gray-600">
            Only the organization owner can access and modify these settings. Contact your organization owner
            for changes.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = async (_section: string) => {
    if (!organization?.id) return;

    try {
      await updateOrganizationMutation.mutateAsync({
        orgId: organization.id,
        name: settings.name,
        slug: organization.slug,
      });
      setIsEditing(null);
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error("Failed to update organization settings");
    }
  };

  const handleDelete = async () => {
    if (!organization?.id || deleteConfirmation !== organization.name) return;

    try {
      await deleteOrganizationMutation.mutateAsync({ orgId: organization.id });
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to delete organization:", error);
      toast.error("Failed to delete organization");
    }
  };

  const EditableField = ({
    label,
    value,
    field,
    icon: Icon,
    section,
    type = "text",
  }: {
    label: string;
    value: string;
    field: keyof OrganizationSettings;
    icon: React.ComponentType<{ className?: string }>;
    section: string;
    type?: "text" | "phone";
  }) => {
    const isEditingField = isEditing === `${section}-${field}`;

    return (
      <div className="flex items-center justify-between py-4 border-b border-gray-200 last:border-0">
        <div className="flex items-center gap-3 flex-1">
          <Icon className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">{label}</p>
            {isEditingField ? (
              type === "phone" ? (
                <PhoneInput
                  international
                  defaultCountry="QA"
                  value={settings[field] as string}
                  onChange={(value) => setSettings({ ...settings, [field]: value || "" })}
                  className="mt-1 phone-input-custom"
                />
              ) : (
                <input
                  type="text"
                  value={settings[field] as string}
                  onChange={(e) => setSettings({ ...settings, [field]: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              )
            ) : (
              <p className="text-sm text-gray-900 mt-1">{value || "None listed"}</p>
            )}
          </div>
        </div>
        {isEditingField ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(section)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => setIsEditing(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(`${section}-${field}`)}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.settings.organization.title}</h1>
          <p className="text-gray-600">{t.settings.organization.subtitle}</p>
        </div>

        {/* Logo Upload */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t.settings.organization.logo.title}
          </h3>
          <p className="text-sm text-gray-600 mb-4">{t.settings.organization.logo.subtitle}</p>
          <div className="flex items-center gap-6">
            <LogoUpload
              currentLogoUrl={organization?.logo || undefined}
              endpoint={`/api/v1/organizations/${organization?.id}/logo`}
              method="PUT"
              maxSize={2 * 1024 * 1024} // 2MB
              onSuccess={(_metadata) => {
                queryClient.invalidateQueries({ queryKey: ['organization'] });
                toast.success(t.settings.organization.logo.uploadSuccess ?? "Logo updated successfully");
              }}
              onError={(_error) => {
                toast.error(t.settings.organization.logo.uploadFailed ?? "Failed to upload logo");
              }}
            />
            <div>
              <p className="text-xs text-gray-500">{t.settings.organization.logo.recommended}</p>
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.settings.organization.companyInfo.title}
              </h2>
              <p className="text-sm text-gray-600">{t.settings.organization.companyInfo.subtitle}</p>
            </div>
          </div>
          <div className="space-y-0">
            <EditableField
              label={t.settings.organization.companyInfo.name}
              value={settings.name}
              field="name"
              icon={Building2}
              section="company"
            />
            <EditableField
              label={t.settings.organization.companyInfo.address}
              value={settings.address || ""}
              field="address"
              icon={MapPin}
              section="company"
            />
            <EditableField
              label={t.settings.organization.companyInfo.email}
              value={settings.email || ""}
              field="email"
              icon={Mail}
              section="company"
            />
            <EditableField
              label={t.settings.organization.companyInfo.phone}
              value={settings.phone || ""}
              field="phone"
              icon={Phone}
              section="company"
              type="phone"
            />
            <EditableField
              label={t.settings.organization.companyInfo.website}
              value={settings.website || ""}
              field="website"
              icon={Globe}
              section="company"
            />
            <EditableField
              label={t.settings.organization.companyInfo.industry}
              value={settings.industry || ""}
              field="industry"
              icon={FileText}
              section="company"
            />
          </div>
        </div>

        {/* Legal Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.settings.organization.legalInfo.title}
              </h2>
              <p className="text-sm text-gray-600">{t.settings.organization.legalInfo.subtitle}</p>
            </div>
          </div>
          <div className="space-y-0">
            <EditableField
              label={t.settings.organization.legalInfo.legalName}
              value={settings.legalName || ""}
              field="legalName"
              icon={Building2}
              section="legal"
            />
            <EditableField
              label={t.settings.organization.legalInfo.businessNumber}
              value={settings.businessNumber || ""}
              field="businessNumber"
              icon={FileText}
              section="legal"
            />
            <EditableField
              label={t.settings.organization.legalInfo.gstNumber}
              value={settings.gstNumber || ""}
              field="gstNumber"
              icon={FileText}
              section="legal"
            />
            <EditableField
              label={t.settings.organization.legalInfo.businessType}
              value={settings.businessType || ""}
              field="businessType"
              icon={Building2}
              section="legal"
            />
            <EditableField
              label={t.settings.organization.legalInfo.legalAddress}
              value={settings.legalAddress || ""}
              field="legalAddress"
              icon={MapPin}
              section="legal"
            />
          </div>
        </div>

        {/* Customer Contact Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.settings.organization.customerContact.title}
              </h2>
              <p className="text-sm text-gray-600">{t.settings.organization.customerContact.subtitle}</p>
            </div>
          </div>
          <div className="space-y-0">
            <EditableField
              label={t.settings.organization.customerContact.email}
              value={settings.customerEmail || ""}
              field="customerEmail"
              icon={Mail}
              section="customer"
            />
            <EditableField
              label={t.settings.organization.customerContact.address}
              value={settings.customerAddress || ""}
              field="customerAddress"
              icon={MapPin}
              section="customer"
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.settings.organization.preferences.title}
              </h2>
              <p className="text-sm text-gray-600">{t.settings.organization.preferences.subtitle}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.settings.organization.preferences.language}
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.settings.organization.preferences.currency}
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="GCC Currencies">
                  <option value="QAR">Qatari Riyal (QAR)</option>
                  <option value="AED">UAE Dirham (AED)</option>
                  <option value="SAR">Saudi Riyal (SAR)</option>
                  <option value="KWD">Kuwaiti Dinar (KWD)</option>
                  <option value="BHD">Bahraini Dinar (BHD)</option>
                  <option value="OMR">Omani Rial (OMR)</option>
                </optgroup>
                <optgroup label="Major MENA Currencies">
                  <option value="EGP">Egyptian Pound (EGP)</option>
                  <option value="JOD">Jordanian Dinar (JOD)</option>
                  <option value="TND">Tunisian Dinar (TND)</option>
                  <option value="MAD">Moroccan Dirham (MAD)</option>
                </optgroup>
                <optgroup label="International">
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.settings.organization.preferences.dateFormat}
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="dd/mm/yyyy">dd/mm/yyyy</option>
                <option value="mm/dd/yyyy">mm/dd/yyyy</option>
                <option value="yyyy-mm-dd">yyyy-mm-dd</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.settings.organization.preferences.fiscalYearStart}
              </label>
              <select
                value={settings.fiscalYearStart}
                onChange={(e) => setSettings({ ...settings, fiscalYearStart: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {[
                  { key: "January", label: t.settings.organization.months.january },
                  { key: "February", label: t.settings.organization.months.february },
                  { key: "March", label: t.settings.organization.months.march },
                  { key: "April", label: t.settings.organization.months.april },
                  { key: "May", label: t.settings.organization.months.may },
                  { key: "June", label: t.settings.organization.months.june },
                  { key: "July", label: t.settings.organization.months.july },
                  { key: "August", label: t.settings.organization.months.august },
                  { key: "September", label: t.settings.organization.months.september },
                  { key: "October", label: t.settings.organization.months.october },
                  { key: "November", label: t.settings.organization.months.november },
                  { key: "December", label: t.settings.organization.months.december },
                ].map((month) => (
                  <option key={month.key} value={month.key}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t.settings.organization.dangerZone.title}
              </h2>
              <p className="text-sm text-gray-600">{t.settings.organization.dangerZone.subtitle}</p>
            </div>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => setShowTransferModal(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <ArrowRightLeft className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">
                    {t.settings.organization.dangerZone.transferOwnership}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t.settings.organization.dangerZone.transferOwnershipDesc}
                  </p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full px-4 py-3 border border-red-300 rounded-lg hover:bg-red-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <p className="font-medium text-red-900">
                    {t.settings.organization.dangerZone.deleteOrganization}
                  </p>
                  <p className="text-sm text-red-600">
                    {t.settings.organization.dangerZone.deleteOrganizationDesc}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Transfer Ownership Modal */}
        <AnimatePresence>
          {showTransferModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {t.settings.organization.transferModal.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  {t.settings.organization.transferModal.description.replace(
                    "{orgName}",
                    organization?.name || "",
                  )}
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.settings.organization.transferModal.selectLabel}
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">{t.settings.organization.transferModal.selectPlaceholder}</option>
                    {/* Members would be populated here */}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {t.settings.organization.transferModal.cancel}
                  </button>
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {t.settings.organization.transferModal.confirm}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Organization Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-semibold text-gray-900">
                    {t.settings.organization.deleteModal.title}
                  </h3>
                </div>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    This action{" "}
                    <span className="font-bold text-red-600">
                      {t.settings.organization.deleteModal.cannotUndo}
                    </span>
                    . {t.settings.organization.deleteModal.willDelete}
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 mb-4">
                    <li>{t.settings.organization.deleteModal.dataItem1}</li>
                    <li>{t.settings.organization.deleteModal.dataItem2}</li>
                    <li>{t.settings.organization.deleteModal.dataItem3}</li>
                    <li>{t.settings.organization.deleteModal.dataItem4}</li>
                  </ul>
                  <p className="text-sm text-gray-600 mb-4">
                    {t.settings.organization.deleteModal.confirmPrompt.replace(
                      "{orgName}",
                      organization?.name || "",
                    )}
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={organization?.name}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteConfirmation("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {t.settings.organization.deleteModal.cancel}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={
                      deleteConfirmation !== organization?.name || deleteOrganizationMutation.isPending
                    }
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleteOrganizationMutation.isPending
                      ? t.settings.organization.deleteModal.deleting
                      : t.settings.organization.deleteModal.confirm}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </div>
  );
}

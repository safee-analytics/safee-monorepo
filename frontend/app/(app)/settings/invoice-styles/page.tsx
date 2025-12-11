"use client";

import { useState, useEffect, startTransition } from "react";
import { useActiveOrganization, useInvoiceStyles, useSaveInvoiceStyles } from "@/lib/api/hooks";
import {
  Upload,
  Palette,
  Type,
  Eye,
  Save,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Mail,
  Printer,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast, SafeeToastContainer } from "@/components/feedback";
import { useTranslation } from "@/lib/providers/TranslationProvider";
import { logError } from "@/lib/utils/logger";

interface InvoiceStyle {
  // Logo
  logoUrl?: string;
  logoPosition: "left" | "center" | "right";

  // Colors
  primaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;

  // Fonts
  headingFont: string;
  bodyFont: string;
  fontSize: "small" | "medium" | "large";

  // Layout
  showLogo: boolean;
  showCompanyDetails: boolean;
  showFooter: boolean;
  footerText: string;

  // Labels
  invoiceLabel: string;
  dateLabel: string;
  dueLabel: string;
  billToLabel: string;
  itemLabel: string;
  quantityLabel: string;
  rateLabel: string;
  amountLabel: string;
  totalLabel: string;
}

export default function InvoiceStylesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { data: organization } = useActiveOrganization();
  const { data: savedStyle } = useInvoiceStyles(organization?.id || "");
  const saveStyleMutation = useSaveInvoiceStyles();
  const [activeTab, setActiveTab] = useState<"design" | "content" | "emails">("design");
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [style, setStyle] = useState<InvoiceStyle>({
    logoUrl: undefined,
    logoPosition: "left",
    primaryColor: "#3B82F6",
    accentColor: "#8B5CF6",
    textColor: "#1F2937",
    backgroundColor: "#FFFFFF",
    headingFont: "Inter",
    bodyFont: "Inter",
    fontSize: "medium",
    showLogo: true,
    showCompanyDetails: true,
    showFooter: true,
    footerText: t.settings.invoiceStyles.defaults.footerText,
    invoiceLabel: t.settings.invoiceStyles.defaults.invoiceLabel,
    dateLabel: t.settings.invoiceStyles.defaults.dateLabel,
    dueLabel: t.settings.invoiceStyles.defaults.dueLabel,
    billToLabel: t.settings.invoiceStyles.defaults.billToLabel,
    itemLabel: t.settings.invoiceStyles.defaults.itemLabel,
    quantityLabel: t.settings.invoiceStyles.defaults.quantityLabel,
    rateLabel: t.settings.invoiceStyles.defaults.rateLabel,
    amountLabel: t.settings.invoiceStyles.defaults.amountLabel,
    totalLabel: t.settings.invoiceStyles.defaults.totalLabel,
  });

  // Load saved styles when they become available
  useEffect(() => {
    if (savedStyle) {
      startTransition(() => {
        setStyle(savedStyle);
      });
    }
  }, [savedStyle]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStyle({ ...style, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!organization?.id) return;

    try {
      await saveStyleMutation.mutateAsync({
        ...style,
        organizationId: organization.id,
      });
      toast.success(t.settings.invoiceStyles.alerts.saveSuccess);
    } catch (err) {
      toast.error(t.settings.invoiceStyles.alerts.saveFailed);
      logError("Failed to save invoice style", err, { organizationId: organization.id, style });
    }
  };

  const handleReset = () => {
    setStyle({
      logoUrl: undefined,
      logoPosition: "left",
      primaryColor: "#3B82F6",
      accentColor: "#8B5CF6",
      textColor: "#1F2937",
      backgroundColor: "#FFFFFF",
      headingFont: "Inter",
      bodyFont: "Inter",
      fontSize: "medium",
      showLogo: true,
      showCompanyDetails: true,
      showFooter: true,
      footerText: t.settings.invoiceStyles.defaults.footerText,
      invoiceLabel: t.settings.invoiceStyles.defaults.invoiceLabel,
      dateLabel: t.settings.invoiceStyles.defaults.dateLabel,
      dueLabel: t.settings.invoiceStyles.defaults.dueLabel,
      billToLabel: t.settings.invoiceStyles.defaults.billToLabel,
      itemLabel: t.settings.invoiceStyles.defaults.itemLabel,
      quantityLabel: t.settings.invoiceStyles.defaults.quantityLabel,
      rateLabel: t.settings.invoiceStyles.defaults.rateLabel,
      amountLabel: t.settings.invoiceStyles.defaults.amountLabel,
      totalLabel: t.settings.invoiceStyles.defaults.totalLabel,
    });
    setLogoFile(null);
  };

  const fontOptions = [
    "Inter",
    "Roboto",
    "Open Sans",
    "Lato",
    "Montserrat",
    "Poppins",
    "Arial",
    "Times New Roman",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{t.settings.invoiceStyles.title}</h1>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <Mail className="w-4 h-4" />
            {t.settings.invoiceStyles.giveFeedback}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Left Panel - Customization */}
        <div className="w-1/2 bg-gray-50 p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 80px)" }}>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => {
                setActiveTab("design");
              }}
              className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
                activeTab === "design" ? "bg-gray-700 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.settings.invoiceStyles.tabs.design}
            </button>
            <button
              onClick={() => {
                setActiveTab("content");
              }}
              className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
                activeTab === "content"
                  ? "bg-gray-700 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.settings.invoiceStyles.tabs.content}
            </button>
            <button
              onClick={() => {
                setActiveTab("emails");
              }}
              className={`px-6 py-3 font-medium rounded-t-lg transition-colors ${
                activeTab === "emails" ? "bg-gray-700 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {t.settings.invoiceStyles.tabs.emails}
            </button>
          </div>

          {/* Design Tab */}
          {activeTab === "design" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Templates */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    {t.settings.invoiceStyles.design.templates.title}
                  </h3>
                </div>
                <button className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left text-sm text-gray-700">
                  {t.settings.invoiceStyles.design.templates.browseButton}
                </button>
              </div>

              {/* Logo Upload */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-green-500 flex items-center justify-center">
                    {logoFile ? (
                      <ImageIcon className="w-5 h-5 text-green-600" />
                    ) : (
                      <Upload className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {t.settings.invoiceStyles.design.logo.title}
                  </h3>
                </div>
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-center text-sm text-gray-700"
                  >
                    {logoFile ? logoFile.name : t.settings.invoiceStyles.design.logo.chooseFile}
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.design.logo.position}
                    </label>
                    <div className="flex gap-2">
                      {(["left", "center", "right"] as const).map((pos) => (
                        <button
                          key={pos}
                          onClick={() => {
                            setStyle({ ...style, logoPosition: pos });
                          }}
                          className={`flex-1 px-4 py-2 border rounded-lg text-sm ${
                            style.logoPosition === pos
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {t.settings.invoiceStyles.design.logo.positions[pos]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 via-blue-500 to-purple-500 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {t.settings.invoiceStyles.design.colors.title}
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.design.colors.primaryColor}
                    </label>
                    <input
                      type="color"
                      value={style.primaryColor}
                      onChange={(e) => {
                        setStyle({ ...style, primaryColor: e.target.value });
                      }}
                      className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.design.colors.accentColor}
                    </label>
                    <input
                      type="color"
                      value={style.accentColor}
                      onChange={(e) => {
                        setStyle({ ...style, accentColor: e.target.value });
                      }}
                      className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.design.colors.textColor}
                    </label>
                    <input
                      type="color"
                      value={style.textColor}
                      onChange={(e) => {
                        setStyle({ ...style, textColor: e.target.value });
                      }}
                      className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.design.colors.background}
                    </label>
                    <input
                      type="color"
                      value={style.backgroundColor}
                      onChange={(e) => {
                        setStyle({ ...style, backgroundColor: e.target.value });
                      }}
                      className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Fonts */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Type className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">
                    {t.settings.invoiceStyles.design.fonts.title}
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.design.fonts.headingFont}
                    </label>
                    <select
                      value={style.headingFont}
                      onChange={(e) => {
                        setStyle({ ...style, headingFont: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {fontOptions.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.design.fonts.bodyFont}
                    </label>
                    <select
                      value={style.bodyFont}
                      onChange={(e) => {
                        setStyle({ ...style, bodyFont: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {fontOptions.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.design.fonts.fontSize}
                    </label>
                    <div className="flex gap-2">
                      {(["small", "medium", "large"] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            setStyle({ ...style, fontSize: size });
                          }}
                          className={`flex-1 px-4 py-2 border rounded-lg text-sm ${
                            style.fontSize === size
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-300 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {t.settings.invoiceStyles.design.fonts.sizes[size]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Print Layout */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <Printer className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">
                    {t.settings.invoiceStyles.design.print.title}
                  </h3>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={style.showLogo}
                      onChange={(e) => {
                        setStyle({ ...style, showLogo: e.target.checked });
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t.settings.invoiceStyles.design.print.showLogo}
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={style.showCompanyDetails}
                      onChange={(e) => {
                        setStyle({ ...style, showCompanyDetails: e.target.checked });
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t.settings.invoiceStyles.design.print.showCompanyDetails}
                    </span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={style.showFooter}
                      onChange={(e) => {
                        setStyle({ ...style, showFooter: e.target.checked });
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {t.settings.invoiceStyles.design.print.showFooter}
                    </span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">{t.settings.invoiceStyles.content.title}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.content.invoiceTitle}
                    </label>
                    <input
                      type="text"
                      value={style.invoiceLabel}
                      onChange={(e) => {
                        setStyle({ ...style, invoiceLabel: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.content.billToLabel}
                    </label>
                    <input
                      type="text"
                      value={style.billToLabel}
                      onChange={(e) => {
                        setStyle({ ...style, billToLabel: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.content.totalLabel}
                    </label>
                    <input
                      type="text"
                      value={style.totalLabel}
                      onChange={(e) => {
                        setStyle({ ...style, totalLabel: e.target.value });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.content.footerMessage}
                    </label>
                    <textarea
                      value={style.footerText}
                      onChange={(e) => {
                        setStyle({ ...style, footerText: e.target.value });
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Emails Tab */}
          {activeTab === "emails" && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">{t.settings.invoiceStyles.emails.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{t.settings.invoiceStyles.emails.subtitle}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.emails.subjectLine}
                    </label>
                    <input
                      type="text"
                      placeholder={t.settings.invoiceStyles.emails.subjectPlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.settings.invoiceStyles.emails.emailMessage}
                    </label>
                    <textarea
                      rows={6}
                      placeholder={t.settings.invoiceStyles.emails.messagePlaceholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div
          className="w-1/2 bg-white p-8 overflow-y-auto border-l border-gray-200"
          style={{ maxHeight: "calc(100vh - 80px)" }}
        >
          <div
            className="mx-auto shadow-lg"
            style={{
              maxWidth: "800px",
              backgroundColor: style.backgroundColor,
              color: style.textColor,
              fontFamily: style.bodyFont,
            }}
          >
            {/* Invoice Preview */}
            <div className="p-8">
              {/* Header */}
              <div
                className={`flex ${style.logoPosition === "center" ? "justify-center" : style.logoPosition === "right" ? "justify-end" : "justify-start"} mb-6`}
              >
                {style.showLogo && style.logoUrl ? (
                  <img src={style.logoUrl} alt="Logo" className="h-16 object-contain" />
                ) : style.showLogo ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: style.primaryColor }}
                    >
                      S
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Company Info */}
              {style.showCompanyDetails && (
                <div className="mb-8 text-sm">
                  <p className="font-semibold" style={{ fontFamily: style.headingFont }}>
                    {organization?.name || "Safee Analytics"}
                  </p>
                  <p>151 Mill Street</p>
                  <p>Toronto, ON M5A 0G2</p>
                  <p>+16047815604</p>
                  <p>mahmoudashraf960@yahoo.com</p>
                </div>
              )}

              {/* Invoice Title */}
              <h1
                className="text-3xl font-bold mb-8"
                style={{ color: style.primaryColor, fontFamily: style.headingFont }}
              >
                {style.invoiceLabel}
              </h1>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="font-semibold mb-2" style={{ fontFamily: style.headingFont }}>
                    {style.billToLabel}
                  </p>
                  <p>Smith Co.</p>
                  <p>123 Main Street</p>
                  <p>City, ON K1T 2T1</p>
                </div>
                <div className="text-right text-sm">
                  <div className="mb-2">
                    <span className="font-semibold">{t.settings.invoiceStyles.preview.invoiceNumber}</span>
                    <span className="ml-4">12345</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">{style.dateLabel}</span>
                    <span className="ml-4">07/01/2018</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">{t.settings.invoiceStyles.preview.terms}</span>
                    <span className="ml-4">Net 30</span>
                  </div>
                  <div>
                    <span className="font-semibold">{style.dueLabel}</span>
                    <span className="ml-4">06/02/2018</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-8">
                <thead>
                  <tr
                    className="border-b-2"
                    style={{
                      borderColor: style.accentColor,
                      backgroundColor: style.accentColor,
                    }}
                  >
                    <th className="text-left py-3 px-2 text-sm font-semibold">
                      {t.settings.invoiceStyles.preview.dateHeader}
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-semibold">{style.itemLabel}</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold">
                      {t.settings.invoiceStyles.preview.descriptionHeader}
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-semibold">{style.quantityLabel}</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold">{style.rateLabel}</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold">{style.amountLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-2 text-sm">07/01/2018</td>
                    <td className="py-3 px-2 text-sm">Item name</td>
                    <td className="py-3 px-2 text-sm">Description of the item</td>
                    <td className="py-3 px-2 text-sm text-center">2</td>
                    <td className="py-3 px-2 text-sm text-right">$225.00</td>
                    <td className="py-3 px-2 text-sm text-right">$450.00</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-2 text-sm">07/01/2018</td>
                    <td className="py-3 px-2 text-sm">Item name</td>
                    <td className="py-3 px-2 text-sm">Description of the item</td>
                    <td className="py-3 px-2 text-sm text-center">1</td>
                    <td className="py-3 px-2 text-sm text-right">$225.00</td>
                    <td className="py-3 px-2 text-sm text-right">$225.00</td>
                  </tr>
                </tbody>
              </table>

              {/* Total */}
              <div className="flex justify-end mb-8">
                <div className="text-right">
                  <p className="text-sm mb-2">{style.totalLabel}</p>
                  <p className="text-3xl font-bold" style={{ color: style.primaryColor }}>
                    $675.00
                  </p>
                </div>
              </div>

              {/* Footer */}
              {style.showFooter && (
                <div className="text-center text-sm text-gray-600 pt-8 border-t border-gray-200">
                  {style.footerText}
                </div>
              )}

              {/* Page Number */}
              <div className="text-center text-xs text-gray-400 mt-4">
                {t.settings.invoiceStyles.preview.pageNumber}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-4 z-10">
        <button
          onClick={handleReset}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          {t.settings.invoiceStyles.actions.reset}
        </button>
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          {t.settings.invoiceStyles.actions.previewPDF}
        </button>
        <button
          onClick={() => {
            void handleSave();
          }}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {t.settings.invoiceStyles.actions.done}
        </button>
      </div>
      <SafeeToastContainer notifications={toast.notifications} onRemove={toast.removeToast} />
    </div>
  );
}

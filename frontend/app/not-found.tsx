"use client";

import Link from "next/link";
import { SafeeLogo } from "@/components/common/SafeeLogo";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-safee-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <SafeeLogo size="lg" showText={true} />
        </div>

        {/* 404 Number */}
        <div className="relative mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-safee-500 to-safee-700 leading-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-safee-100 rounded-full blur-3xl opacity-50"></div>
          </div>
        </div>

        {/* Message */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Page Not Found</h2>
          <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
            Looks like this page took a detour. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-safee-500 to-safee-600 text-white font-semibold rounded-lg hover:from-safee-600 hover:to-safee-700 transition-all shadow-lg shadow-safee-500/25 hover:shadow-xl hover:shadow-safee-500/30 transform hover:-translate-y-0.5"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>

          <button
            onClick={() => {
              window.history.back();
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-safee-300 hover:bg-safee-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Quick Links</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/accounting"
              className="text-sm text-gray-600 hover:text-safee-600 hover:bg-safee-50 px-4 py-2 rounded-lg transition-colors"
            >
              Accounting
            </Link>
            <Link
              href="/hr"
              className="text-sm text-gray-600 hover:text-safee-600 hover:bg-safee-50 px-4 py-2 rounded-lg transition-colors"
            >
              HR & Payroll
            </Link>
            <Link
              href="/crm"
              className="text-sm text-gray-600 hover:text-safee-600 hover:bg-safee-50 px-4 py-2 rounded-lg transition-colors"
            >
              CRM
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-600 hover:text-safee-600 hover:bg-safee-50 px-4 py-2 rounded-lg transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-400 mt-8">
          Need help?{" "}
          <Link href="/settings" className="text-safee-600 hover:text-safee-700 font-medium">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}

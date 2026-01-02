"use client";

import { FileText } from "lucide-react";

export default function BankReconciliationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Bank Reconciliation</h1>
            <p className="text-gray-600 mb-6">
              Bank reconciliation feature is coming soon. Match bank transactions to accounting records and reconcile
              accounts.
            </p>
            <p className="text-sm text-gray-500">
              This is part of the Hisabiq accounting module that will be ported from Odoo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/audit/ui/StatCard";

interface CaseStatsProps {
  totalCases: number;
  activeCases: number;
  completedCases: number;
  overdueCases: number;
}

export function CaseStats({ totalCases, activeCases, completedCases, overdueCases }: CaseStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <StatCard
        title="Total Cases"
        value={totalCases}
        icon={FileText}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
      <StatCard
        title="Active"
        value={activeCases}
        icon={Clock}
        iconBgColor="bg-yellow-100"
        iconColor="text-yellow-600"
      />
      <StatCard
        title="Completed"
        value={completedCases}
        icon={CheckCircle}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />
      <StatCard
        title="Overdue"
        value={overdueCases}
        icon={AlertTriangle}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
      />
    </div>
  );
}

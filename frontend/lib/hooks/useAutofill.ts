import { useMemo } from "react";
import { useCases } from "@/lib/api/hooks";
import { differenceInDays, addDays, isBefore } from "date-fns";

interface AutofillSuggestions {
  suggestAuditType: (clientName: string) => string | undefined;
  suggestDueDate: (auditType: string) => Date;
  suggestPriority: (clientName: string, dueDate: Date) => string;
  suggestStatus: (dueDate: Date) => string;
  suggestTeam: (auditType: string, clientName?: string) => Array<{ userId: string; role: string }>;
  getClientHistory: (clientName: string) => AutofillClientHistory;
  getRecentClients: () => Array<{ name: string; lastCase: any; count: number }>;
  getAuditTypeStats: () => Record<string, number>;
}

interface AutofillClientHistory {
  totalCases: number;
  mostCommonAuditType: string | undefined;
  averageDuration: number;
  lastCase: any;
  commonPriority: string | undefined;
}

/**
 * Intelligent autofill hook that analyzes historical case data
 * to provide smart suggestions for new case creation
 */
export function useAutofill(): AutofillSuggestions {
  // Fetch recent cases for pattern detection (last 50 cases)
  const { data: recentCases } = useCases();

  const suggestions = useMemo(() => {
    const cases = recentCases || [];

    return {
      /**
       * Suggests audit type based on client's previous cases
       */
      suggestAuditType: (clientName: string): string | undefined => {
        if (!clientName) return undefined;

        const clientCases = cases.filter((c) =>
          c.clientName?.toLowerCase().includes(clientName.toLowerCase()),
        );

        if (clientCases.length === 0) return undefined;

        // Count audit type frequency
        const typeCounts = clientCases.reduce(
          (acc, c) => {
            const type = c.auditType || "general_audit";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        // Return most common audit type
        const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
        return sorted[0]?.[0];
      },

      /**
       * Suggests due date based on average duration for audit type + 20% buffer
       */
      suggestDueDate: (auditType: string): Date => {
        if (!auditType) return addDays(new Date(), 30); // Default 30 days

        const typeCases = cases.filter((c) => c.auditType === auditType);

        if (typeCases.length === 0) return addDays(new Date(), 30);

        // Calculate average duration from completed cases
        const durations = typeCases
          .filter((c) => c.status === "completed" && c.dueDate && c.createdAt)
          .map((c) => {
            const start = new Date(c.createdAt);
            const due = new Date(c.dueDate!);
            return differenceInDays(due, start);
          })
          .filter((d) => d > 0 && d < 365); // Sanity check

        if (durations.length === 0) {
          // Fallback to audit type defaults
          const defaults: Record<string, number> = {
            financial_audit: 45,
            compliance_audit: 30,
            icv_audit: 20,
            operational_audit: 35,
            it_audit: 40,
            general_audit: 30,
          };
          return addDays(new Date(), defaults[auditType] || 30);
        }

        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        // Add 20% buffer for safety
        const suggestedDays = Math.round(avgDuration * 1.2);
        return addDays(new Date(), suggestedDays);
      },

      /**
       * Suggests priority based on client patterns and timeline
       */
      suggestPriority: (clientName: string, dueDate: Date): string => {
        const daysUntilDue = differenceInDays(dueDate, new Date());

        // Check if client typically requires high priority
        const clientCases = cases.filter((c) =>
          c.clientName?.toLowerCase().includes(clientName.toLowerCase()),
        );

        const highPriorityCount = clientCases.filter(
          (c) => c.priority === "high" || c.priority === "critical",
        ).length;
        const isHighPriorityClient = clientCases.length > 0 && highPriorityCount / clientCases.length > 0.6;

        // Priority logic
        if (daysUntilDue < 7) return "critical";
        if (daysUntilDue < 14 || isHighPriorityClient) return "high";
        if (daysUntilDue < 30) return "medium";
        return "low";
      },

      /**
       * Suggests initial status based on due date
       */
      suggestStatus: (dueDate: Date): string => {
        const today = new Date();
        if (isBefore(dueDate, today)) return "overdue";

        const daysUntilDue = differenceInDays(dueDate, today);
        if (daysUntilDue < 7) return "in-progress"; // Start immediately if urgent
        return "pending";
      },

      /**
       * Suggests team members based on audit type and client history
       */
      suggestTeam: (auditType: string, clientName?: string): Array<{ userId: string; role: string }> => {
        // Find similar cases
        const similarCases = cases.filter(
          (c) =>
            c.auditType === auditType ||
            (clientName && c.clientName?.toLowerCase().includes(clientName.toLowerCase())),
        );

        if (similarCases.length === 0) return [];

        // Extract team patterns from assignments
        const teamPatterns: Record<string, { count: number; roles: Record<string, number> }> = {};

        similarCases.forEach((c) => {
          c.assignments?.forEach((assignment) => {
            if (!assignment.userId) return;

            if (!teamPatterns[assignment.userId]) {
              teamPatterns[assignment.userId] = { count: 0, roles: {} };
            }

            teamPatterns[assignment.userId].count++;
            const role = assignment.role || "staff";
            teamPatterns[assignment.userId].roles[role] =
              (teamPatterns[assignment.userId].roles[role] || 0) + 1;
          });
        });

        // Get top 3 most common team members
        const topMembers = Object.entries(teamPatterns)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 3)
          .map(([userId, data]) => {
            // Get most common role for this user
            const mostCommonRole = Object.entries(data.roles).sort((a, b) => b[1] - a[1])[0]?.[0] || "staff";
            return { userId, role: mostCommonRole };
          });

        return topMembers;
      },

      /**
       * Gets comprehensive client history
       */
      getClientHistory: (clientName: string): AutofillClientHistory => {
        if (!clientName) {
          return {
            totalCases: 0,
            mostCommonAuditType: undefined,
            averageDuration: 30,
            lastCase: undefined,
            commonPriority: undefined,
          };
        }

        const clientCases = cases.filter((c) =>
          c.clientName?.toLowerCase().includes(clientName.toLowerCase()),
        );

        if (clientCases.length === 0) {
          return {
            totalCases: 0,
            mostCommonAuditType: undefined,
            averageDuration: 30,
            lastCase: undefined,
            commonPriority: undefined,
          };
        }

        // Most common audit type
        const typeCounts = clientCases.reduce(
          (acc, c) => {
            const type = c.auditType || "general_audit";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
        const mostCommonAuditType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

        // Average duration
        const completedCases = clientCases.filter(
          (c) => c.status === "completed" && c.dueDate && c.createdAt,
        );
        const durations = completedCases.map((c) =>
          differenceInDays(new Date(c.dueDate!), new Date(c.createdAt)),
        );
        const averageDuration =
          durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 30;

        // Most common priority
        const priorityCounts = clientCases.reduce(
          (acc, c) => {
            const priority = c.priority || "medium";
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
        const commonPriority = Object.entries(priorityCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

        // Last case
        const sortedCases = [...clientCases].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const lastCase = sortedCases[0];

        return {
          totalCases: clientCases.length,
          mostCommonAuditType,
          averageDuration: Math.round(averageDuration),
          lastCase,
          commonPriority,
        };
      },

      /**
       * Gets list of recent clients for autocomplete
       */
      getRecentClients: () => {
        const clientMap = new Map<string, { lastCase: any; count: number }>();

        cases.forEach((c) => {
          if (!c.clientName) return;

          const normalized = c.clientName.toLowerCase();
          if (!clientMap.has(normalized)) {
            clientMap.set(normalized, { lastCase: c, count: 0 });
          }

          const entry = clientMap.get(normalized)!;
          entry.count++;

          // Update last case if this one is more recent
          if (new Date(c.createdAt) > new Date(entry.lastCase.createdAt)) {
            entry.lastCase = c;
          }
        });

        return Array.from(clientMap.entries())
          .map(([name, data]) => ({
            name: data.lastCase.clientName, // Use original casing
            lastCase: data.lastCase,
            count: data.count,
          }))
          .sort((a, b) => new Date(b.lastCase.createdAt).getTime() - new Date(a.lastCase.createdAt).getTime())
          .slice(0, 10); // Top 10 recent clients
      },

      /**
       * Gets audit type statistics for insights
       */
      getAuditTypeStats: () => {
        return cases.reduce(
          (acc, c) => {
            const type = c.auditType || "general_audit";
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );
      },
    };
  }, [recentCases]);

  return suggestions;
}

"use client";

import { useRouter } from "next/navigation";
import { TemplateLibrary } from "@/components/audit/templates/TemplateLibrary";
import type { TemplateResponse } from "@/lib/api/hooks/templates";

export default function TemplatesPage() {
  const router = useRouter();

  const handleCreateNew = () => {
    router.push("/audit/templates/new");
  };

  const handleSelectTemplate = (template: TemplateResponse) => {
    router.push(`/audit/templates/${template.id}`);
  };

  return (
    <div className="h-full">
      <TemplateLibrary
        onCreateNew={handleCreateNew}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}

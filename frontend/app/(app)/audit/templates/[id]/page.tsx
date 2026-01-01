"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { TemplateBuilder } from "@/components/audit/templates/TemplateBuilder";

interface TemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function TemplatePage({ params }: TemplatePageProps) {
  const router = useRouter();
  const { id } = use(params);
  const templateId = id === "new" ? undefined : id;

  const handleSave = (savedTemplateId: string) => {
    // Navigate to the saved template page
    router.push(`/audit/templates/${savedTemplateId}`);
  };

  const handleCancel = () => {
    // Navigate back to templates library
    router.push("/audit/templates");
  };

  return (
    <div className="h-full">
      <TemplateBuilder
        templateId={templateId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

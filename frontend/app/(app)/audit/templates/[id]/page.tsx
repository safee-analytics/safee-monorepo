"use client";

import { useRouter } from "next/navigation";
import { TemplateBuilder } from "@/components/audit/templates/TemplateBuilder";

interface TemplatePageProps {
  params: {
    id: string;
  };
}

export default function TemplatePage({ params }: TemplatePageProps) {
  const router = useRouter();
  const templateId = params.id === "new" ? undefined : params.id;

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

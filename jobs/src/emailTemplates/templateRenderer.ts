import type { EmailTemplate, TemplateRenderContext } from "./types.js";
import { EMAIL_TEMPLATES, type EmailTemplateName } from "./templateRegistry.js";

export class TemplateRenderer {
  private template: EmailTemplate;

  constructor(templateName: EmailTemplateName) {
    const template = EMAIL_TEMPLATES[templateName];
    this.template = template;
  }

  private interpolate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
      if (key in variables) {
        return variables[key];
      }
      return match;
    });
  }

  private validateVariables(variables: Record<string, string>): void {
    const missing = this.template.requiredVariables.filter((v) => !(v in variables));
    if (missing.length > 0) {
      throw new Error(`Missing required template variables: ${missing.join(", ")}`);
    }
  }

  render(context: TemplateRenderContext): { subject: string; html: string; text?: string } {
    this.validateVariables(context.variables);

    const locale = context.locale;

    return {
      subject: this.interpolate(this.template.subject[locale], context.variables),
      html: this.interpolate(this.template.html[locale], context.variables),
      text: this.template.text?.[locale]
        ? this.interpolate(this.template.text[locale], context.variables)
        : undefined,
    };
  }

  getRequiredVariables(): string[] {
    return [...this.template.requiredVariables];
  }
}

export function renderTemplate(
  templateName: EmailTemplateName,
  context: TemplateRenderContext,
): { subject: string; html: string; text?: string } {
  const renderer = new TemplateRenderer(templateName);
  return renderer.render(context);
}

export function getTemplateVariables(templateName: EmailTemplateName): string[] {
  const renderer = new TemplateRenderer(templateName);
  return renderer.getRequiredVariables();
}

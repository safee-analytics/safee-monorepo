import { z } from "zod";

export const todoSchema = z.object({
  id: z.number(),
  text: z.string().min(1, "Task description is required"),
  checked: z.boolean(),
  priority: z.enum(["low", "medium", "high"]),
});

export type Todo = z.infer<typeof todoSchema>;

export const widgetSizeSchema = z.enum(["small", "medium", "large"]);
export type WidgetSize = z.infer<typeof widgetSizeSchema>;

export const widgetSchema = z.object({
  id: z.string(),
  title: z.string(),
  component: z.any(), // Not easily serializable, but good for type safety
  size: widgetSizeSchema,
  minSize: widgetSizeSchema.optional(),
  maxSize: widgetSizeSchema.optional(),
});

export type Widget = z.infer<typeof widgetSchema>;

export const bankSchema = z.object({
  name: z.string(),
  icon: z.any(), // Cannot easily validate React component type with Zod
  color: z.string(),
});

export type Bank = z.infer<typeof bankSchema>;

export const expenseSchema = z.object({
  name: z.string(),
  amount: z.number(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const quickActionSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.any(), // Cannot easily validate React component type with Zod
  href: z.string(),
  color: z.string(),
});

export type QuickAction = z.infer<typeof quickActionSchema>;





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


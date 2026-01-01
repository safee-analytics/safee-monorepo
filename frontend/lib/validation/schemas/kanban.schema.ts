import { z } from "zod";

export const columnTypeSchema = z.enum(["backlog", "todo", "doing", "done"]);
export type ColumnType = z.infer<typeof columnTypeSchema>;

export const cardSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Card title is required"),
  column: columnTypeSchema,
});
export type CardType = z.infer<typeof cardSchema>;

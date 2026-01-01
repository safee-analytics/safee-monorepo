import { z } from "zod";

export const animatedListTodoSchema = z.object({
  id: z.number(),
  text: z.string(),
  checked: z.boolean(),
  time: z.string(),
});

export type AnimatedListTodo = z.infer<typeof animatedListTodoSchema>;

// Error is specifically "hey LLM you screwed up calling this tool, try again but do it better like this"
// Result is for when the LLM has properly called the function
export type ToolResultRes = { result: string; error?: never };
export type ToolErrorRes = { result?: never; error: string };
export type ToolRes = ToolResultRes | ToolErrorRes;

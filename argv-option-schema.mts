
export interface ArgvOptionSchema {
  name: string;
  type: "string" | "string[]" | "boolean";
  flags: string[];
}


type ParseType<T> =
  | { parseLiteralArg: T }
  | { parseArg(value: string): T }
  | { parse(value: string): T }
  | { new(value: string): T }

export interface OptionSchema<T> {
  type: ParseType<T>;
  flags: string[];
}

export type OptionSchemaType<T> = T extends OptionSchema<infer R> ? R : never;

const genericTypeTemplate = new Map<any, ParseType<any>>([
  ['string', { parseArg: (value: string) => value }],
  [String, { parseArg: (value: string) => value }],
  ['string[]', { parseArg: (value: string, beforeArgParse: string[] = []) => [...beforeArgParse, value] }],
  [Array, { parseArg: (value: string, beforeArgParse: string[] = []) => [...beforeArgParse, value] }],
  ['boolean', { parseLiteralArg: true }],
  [Boolean, { parseLiteralArg: true }],
  ['number', { parseArg: (value: string) => Number(value) }],
  [Number, { parseArg: (value: string) => Number(value) }],
]);

export function optionSchema(type: 'string', flags: string[]): OptionSchema<string>
export function optionSchema(type: typeof String, flags: string[]): OptionSchema<string>
export function optionSchema(type: 'string[]', flags: string[]): OptionSchema<string[]>
export function optionSchema(type: typeof Array, flags: string[]): OptionSchema<string[]>
export function optionSchema(type: 'boolean', flags: string[]): OptionSchema<boolean>
export function optionSchema(type: typeof Boolean, flags: string[]): OptionSchema<boolean>
export function optionSchema(type: 'number', flags: string[]): OptionSchema<number>
export function optionSchema(type: typeof Number, flags: string[]): OptionSchema<number>
export function optionSchema<T>(type: ParseType<T>, flags: string[]): OptionSchema<T>;
export function optionSchema(type: any, flags: string[]): OptionSchema<any> {
  const parser = genericTypeTemplate.get(type) ?? type;
  if (typeof parser === 'string') {
    throw new TypeError(`Unsupported type: ${type}`);
  }
  return { type: parser, flags }
}

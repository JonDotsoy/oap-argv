import { OptionSchema, OptionSchemaType } from "./argv-option-schema"
export { optionSchema } from "./argv-option-schema";

const isRecord = (value: any): value is Record<string, any> => value && typeof value === 'object' && !Array.isArray(value)
const hasProperty = <T extends string>(object: Record<any, any>, property: T): object is Record<T, any> => object.hasOwnProperty(property)
const isConstructor = (value: any): value is new (...args: any[]) => any => typeof value === 'function' && isRecord(value.prototype) && value.prototype.constructor === value


type Schema = Record<string, OptionSchema<any>>


function matchOption<T extends Schema>(schemaOptions: T, arg: string, nextArg: () => string): { optionName: string, value: OptionSchemaType<any> } | null {
  for (const [optionName, optionSchema] of Object.entries(schemaOptions)) {
    const toValue = (getValue: () => string) => {
      const typeIsRecord = isRecord(optionSchema.type);
      if (typeIsRecord && hasProperty(optionSchema.type, 'parseLiteralArg')) {
        return optionSchema.type.parseLiteralArg;
      }

      if (typeIsRecord && hasProperty(optionSchema.type, 'parseArg')) {
        return optionSchema.type.parseArg(getValue());
      }

      if (typeIsRecord && hasProperty(optionSchema.type, 'parse')) {
        return optionSchema.type.parse(getValue());
      }

      if (isConstructor(optionSchema.type)) {
        return new optionSchema.type(getValue());
      }

      throw new Error(`Unsupported type: ${optionSchema.type}`,);
    }
    for (const flag of optionSchema.flags) {
      if (arg.startsWith(`${flag}=`)) {
        return {
          optionName,
          value: toValue(() => arg.substring(flag.length + 1)),
        }
      }
      if (arg.startsWith(`${flag}`)) {
        return {
          optionName,
          value: toValue(() => nextArg()),
        }
      }
    }
  }

  return null;
}


export type OptionsTypeOf<T extends Schema> = { [P in keyof T]?: OptionSchemaType<T[P]> }

export interface ParseOptions {
  splitSymbol?: string | false
}

export function parse<T extends Schema>(
  argv: string[],
  schemaOptions?: T,
  parseOptions?: ParseOptions,
): {
  commands: string[],
  options: OptionsTypeOf<T>,
  restArgv: string[],
} {
  const splitSymbol = parseOptions?.splitSymbol ?? '--';
  const indexSplitArgv = argv.findIndex(arg => arg === splitSymbol);
  const posSpitArgv = indexSplitArgv !== -1 ? indexSplitArgv : argv.length;
  const pureArgv = [...argv].splice(0, posSpitArgv);
  const restArgv = [...argv].splice(posSpitArgv);
  const iteratorArgv = pureArgv.values();

  const commands: string[] = []
  const options: Record<string, any> = {};


  for (const arg of iteratorArgv) {
    const nextArg = () => iteratorArgv.next().value ?? '';
    if (arg.startsWith('-') && schemaOptions) {
      const optionMatched = matchOption(schemaOptions, arg, nextArg)
      if (optionMatched) {
        if (Array.isArray(optionMatched.value)) {
          const preValue = options[optionMatched.optionName];
          const preValueArr = Array.isArray(preValue) ? preValue : [];
          options[optionMatched.optionName] = [...preValueArr, ...optionMatched.value]
          continue
        }
        options[optionMatched.optionName] = optionMatched.value
        continue
      }
    }
    commands.push(arg)
  }

  return { commands, options, restArgv }
}

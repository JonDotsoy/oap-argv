import type { ArgvOptionSchema } from "./argv-option-schema.mjs"


function matchOption(schemaOptions: ArgvOptionSchema[], command: string, commands: IterableIterator<string>): { optionSchema: ArgvOptionSchema, value: string | boolean } | null {
  for (const optionSchema of schemaOptions) {
    if (optionSchema.type === "boolean") {
      for (const flag of optionSchema.flags) {
        if (command.startsWith(`${flag}`)) {
          return {
            optionSchema,
            value: true
          }
        }
      }
    }

    if (optionSchema.type === "string" || optionSchema.type === "string[]") {
      const toValue = (value?: string) => {
        return value ?? ''
      }
      for (const flag of optionSchema.flags) {
        if (command.startsWith(`${flag}=`)) {
          return {
            optionSchema,
            value: toValue(command.substring(flag.length + 1)),
          }
        }
        if (command.startsWith(`${flag}`)) {
          return {
            optionSchema,
            value: toValue(commands.next().value),
          }
        }
      }
    }
  }

  return null;
}


export function parse(argv: string[] = process.argv.splice(2), schemaOptions: ArgvOptionSchema[]) {
  const indexSplitArgv = argv.findIndex(arg => arg === '--');
  const posSpitArgv = indexSplitArgv !== -1 ? indexSplitArgv : argv.length;
  const pureArgv = [...argv].splice(0, posSpitArgv);
  const moreArgv = [...argv].splice(posSpitArgv);

  const commands: string[] = []
  const options: Record<string, string[] | string | boolean> = {};

  const iteratorPureArgv = pureArgv.values();

  for (const i of iteratorPureArgv) {
    if (i.startsWith('-')) {
      const optionMatched = matchOption(schemaOptions, i, iteratorPureArgv)
      if (optionMatched) {
        if (optionMatched.optionSchema.type === "string[]" && typeof optionMatched.value === "string") {
          const preValue = options[optionMatched.optionSchema.name];
          const preValueArr = Array.isArray(preValue) ? preValue : [];
          options[optionMatched.optionSchema.name] = [...preValueArr, optionMatched.value]
          continue
        }
        options[optionMatched.optionSchema.name] = optionMatched.value
        continue
      }
    }
    commands.push(i)
  }

  return { commands, options, moreArgv }
}

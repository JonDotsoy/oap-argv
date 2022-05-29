import chalk from "chalk";
import { AsyncLocalStorage } from "node:async_hooks"
import { OptionSchema } from "./argv-option-schema"
import { parse, ParseOptions } from "./argv"

export interface CliSchema {
  parseOptions?: ParseOptions
  header?: string
  arg0?: string
  usage?: string
  description?: string
  footer?: string
  options?: Record<string, [string | undefined, OptionSchema<any>]>
  commands?: Record<string, [string | undefined, CliSchema]>
  loadHandler?: () => Promise<{
    handler?: (arg0: CliSchema | undefined, args: string[], options: Record<string, any>) => Promise<number | void>
    default?: (arg0: CliSchema | undefined, args: string[], options: Record<string, any>) => Promise<number | void>
  }>
}

export const createCliSchema = <T extends CliSchema>(schema: T): T => schema

function generateHelpMessage(schema: CliSchema) {
  let helpMessage: string[] = [];

  if (schema.header) {
    helpMessage.push(`${schema.header}\n\n`)
  }

  helpMessage.push(`Usage: ${schema.arg0 ?? 'cli'} [options] [command]\n\n`);
  if (schema.description) {
    helpMessage.push(`${schema.description}\n\n`);
  }
  if (schema.options) {
    helpMessage.push(`Options:\n`);
    for (const [, [optionDescription = '', optionSchema]] of Object.entries(schema.options)) {
      const flags = optionSchema.flags.sort((a: string, b: string) => a > b ? 1 : -1).join(', ').padEnd(20, ' ');
      helpMessage.push(`  ${flags} ${optionDescription}\n`);
    }
    helpMessage.push(`\n`);
  }
  if (schema.commands) {
    helpMessage.push(`Commands:\n`);
    for (const [commandName, [commandDescription = '']] of Object.entries(schema.commands)) {
      helpMessage.push(`  ${commandName.padEnd(20, ' ')} ${commandDescription}\n`);
    }
    helpMessage.push(`\n`);
  }
  if (schema.footer) {
    helpMessage.push(`${schema.footer}\n`);
  }

  return helpMessage.join("");
}

export class CliManager {
  private constructor(readonly args: string[], readonly schema?: CliSchema, readonly initialOptions?: Record<any, any>) { }

  static run(args: string[], schema?: CliSchema, initialOptions?: Record<any, any>): CliManager {
    const optionSchema = Object.fromEntries(Object.entries(schema?.options ?? {}).map(([optionName, [, optionSchema]]) => [optionName, optionSchema]))
    const { commands, options, restArgv } = parse(args, optionSchema, schema?.parseOptions);
    const [command, ...moreCommands] = commands;

    const subSchemaCommandMatch = schema?.commands?.[command];

    if (subSchemaCommandMatch) {
      const [description, cliSchema] = subSchemaCommandMatch;
      return CliManager.run(
        [...moreCommands, ...restArgv],
        {
          ...cliSchema,
          description: cliSchema.description ?? description,
          arg0: `${schema?.arg0 ?? 'cli'} ${command}`,
          header: cliSchema.header ?? schema?.header,
          footer: cliSchema.footer ?? schema?.footer,
          parseOptions: cliSchema.parseOptions ?? schema?.parseOptions,
        },
        {
          ...initialOptions,
          ...options,
        },
      );
    }

    return new CliManager([...commands, ...restArgv], schema, { ...initialOptions, ...options });
  }

  help(): string {
    return generateHelpMessage(this.schema ?? {})
  }

  get options(): Record<string, any> {
    return this.initialOptions ?? {}
  }

  async runHandler(): Promise<number | void> {
    const args = this.args;
    const option = this.options;
    const loadHandler = await this.schema?.loadHandler?.();

    return CliManager.CliManagerContext.run([args, option], async () => {
      if (typeof loadHandler?.handler === 'function') {
        return loadHandler.handler(this.schema, args, option)
      }

      if (typeof loadHandler?.default === 'function') {
        return loadHandler.default(this.schema, args, option)
      }

      console.error(`${chalk.red('error:')} Command not found: ${this.schema?.arg0 ?? 'cli'} ${args.join(' ')}\n`);
      console.log(this.help());

      return 127
    })
  }

  static CliManagerContext = new AsyncLocalStorage<[string[], Record<string, any>]>();
}

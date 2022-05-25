import { optionSchema } from "./argv"
import { CliManager, createCliSchema } from "./cli-manager";
import test from "node:test";
import asserts from "node:assert"
import { createWriteStream } from "node:fs";
import { inspect } from "node:util";


const snapWS = createWriteStream('.snap')
function snap(spyCalls: any): void {
  const err = new Error()
  Error.captureStackTrace(err, snap)
  err.name = '[[[snap]]]'
  if (err.stack) {
    const t = '[[[snap]]]\n    at '
    const i = err.stack.indexOf(t)
    const s = err.stack.slice(i + t.length)
    const i2 = s.indexOf('\n')
    const s2 = s.slice(0, i2)

    snapWS.write(`${s2}\n\n`)
  } else {
    snapWS.write(`<unknown>\n\n`)
  }

  snapWS.write(`${inspect(spyCalls, { depth: null, maxArrayLength: null })}\n\n`)
}

const spy = (target: any, method: string) => {
  const methodResultDefault = 'methodResultDefault'
  const calls: any[][] = [];
  const fn = target[method];
  const results: Record<number | string, (this: any, ...args: any[]) => any> = {}
  target[method] = (...args: any[]) => {
    const _indexArr = calls.push(args);
    const fnResult = results[_indexArr] ?? results[methodResultDefault];
    return fnResult?.call(target, ...args);
  }
  return {
    calls,
    with(callIndex: number | undefined, result: (this: any, ...args: any[]) => any) {
      return results[callIndex ?? methodResultDefault] = result
    },
    restore: () => {
      target[method] = fn;
    }
  }
}

const cliSchema = createCliSchema({
  header: "I am header",
  description: 'I am description',
  arg0: "my-cli",
  options: {
    env: ['Define environment variables', optionSchema(Array, ["--env", '-e'])],
    version: ['Show version', optionSchema(Boolean, ["--version"])],
    verbose: ['Show verbose messages', optionSchema(Boolean, ["--verbose", '-V'])],
    debug: [, optionSchema(Boolean, ["--debug"])],
    quiet: ['Hide all messages', optionSchema(Boolean, ["--quiet"])],
    help: ['Show help', optionSchema(Boolean, ["--help", '-h'])],
  },
  commands: {
    init: ['Initialize project', {
      options: {
        name: ['Project name', optionSchema(String, ["--name", '-n'])],
        description: ['Project description', optionSchema(String, ["--description", '-d'])],
      },
    }],
    build: ['Build project', {}],
    test: ['Test project', {}],
    serve: ['Serve project', { options: { port: ['Port', optionSchema(Number, ["--port", '-p'])] } }],
    clean: ['Clean project', {}],
    lint: ['Lint project', {
      commands: {
        'fix': ['Fix lint', {
          commands: {
            'all': ['Fix all lint', {
              options: {
                rules: ['Fix all rules', optionSchema(Array, ["--rules", '-r'])],
              },
            }],
          }
        }],
      }
    }],
  },
  footer: 'I am footer',
});

test('cli manager', async (t) => {
  const test = t.test.bind(t);
  const skip = t.skip.bind(t);

  await test("should use cli manager to generate help message", () => {
    asserts.equal(
      CliManager.run([], cliSchema).help(),
      'I am header\n' +
      '\n' +
      'Usage: my-cli [options] [command]\n' +
      '\n' +
      'I am description\n' +
      '\n' +
      'Options:\n' +
      '  --env, -e            Define environment variables\n' +
      '  --version            Show version\n' +
      '  --verbose, -V        Show verbose messages\n' +
      '  --debug              \n' +
      '  --quiet              Hide all messages\n' +
      '  --help, -h           Show help\n' +
      '\n' +
      'Commands:\n' +
      '  init                 Initialize project\n' +
      '  build                Build project\n' +
      '  test                 Test project\n' +
      '  serve                Serve project\n' +
      '  clean                Clean project\n' +
      '  lint                 Lint project\n' +
      '\n' +
      'I am footer\n'
    );

    asserts.equal(
      CliManager.run(['init'], cliSchema).help(),
      'I am header\n' +
      '\n' +
      'Usage: my-cli init [options] [command]\n' +
      '\n' +
      'Initialize project\n' +
      '\n' +
      'Options:\n' +
      '  --name, -n           Project name\n' +
      '  --description, -d    Project description\n' +
      '\n' +
      'I am footer\n',
    );

    asserts.equal(
      CliManager.run(['lint', 'fix', 'all'], cliSchema).help(),
      'I am header\n' +
      '\n' +
      'Usage: my-cli lint fix all [options] [command]\n' +
      '\n' +
      'Fix all lint\n' +
      '\n' +
      'Options:\n' +
      '  --rules, -r          Fix all rules\n' +
      '\n' +
      'I am footer\n'
    );
  });

  await test('should get options', () => {
    asserts.deepEqual(CliManager.run([], cliSchema).options, {});
    asserts.deepEqual(CliManager.run(['-e', 'abc', '--env', 'def', '--env=ghi'], cliSchema).options, { env: ['abc', 'def', 'ghi'] })
    asserts.deepEqual(CliManager.run(['-e', 'abc', '--env', 'def', '--env=ghi', 'no-lint', 'fix', 'all', '-r=rule'], cliSchema).options, { env: ['abc', 'def', 'ghi'] })
    asserts.deepEqual(CliManager.run(['-e', 'abc', '--env', 'def', '--env=ghi', 'lint', 'fix', 'all', '-r=rule'], cliSchema).options, { env: ['abc', 'def', 'ghi'], rules: ['rule'] })
  });

  await test('should get args', () => {
    asserts.deepEqual(CliManager.run(['a', 'b', 'c'], cliSchema).args, ['a', 'b', 'c']);
    asserts.deepEqual(CliManager.run(['-e', 'abc', '--env', 'def', '--env=ghi', 'no-lint', 'fix', 'all', '-r=rule'], cliSchema).args, ['no-lint', 'fix', 'all', '-r=rule'])
  })

  await test('should call handler', async () => {
    const mainHandlerSpyCalls: any[][] = [];
    const customCliSchema = createCliSchema({
      ...cliSchema,
      loadHandler: async () => ({
        handler: async (...args: any[]) => {
          const _indexArr = mainHandlerSpyCalls.push(args);
        },
      }),
    });

    await CliManager.run(['a', '--env', 'def', 'b', 'c'], customCliSchema).runHandler();
    await CliManager.run(['b', '--env', 'abc', 'c'], customCliSchema).runHandler();
    await CliManager.run(['init', '--env', 'abc', 'c'], customCliSchema).runHandler();
    await CliManager.run(['a'], customCliSchema).runHandler();

    asserts.deepEqual(mainHandlerSpyCalls.map(([, ...e]) => e), [
      [['a', 'b', 'c'], { env: ['def'] }],
      [['b', 'c'], { env: ['abc'] }],
      [['a'], {}]
    ]);

  });


  await test('should run a handler without handler defined', async () => {
    const consoleLogSpy = spy(console, 'log');
    const consoleErrorSpy = spy(console, 'error');
    try {
      const statusResult = await CliManager.run(['init', '--env', 'abc', 'c'], cliSchema).runHandler();

      asserts.equal(statusResult, 127);

      snap(consoleErrorSpy.calls)

      asserts.deepEqual(consoleLogSpy.calls, [
        [
          'I am header\n' +
          '\n' +
          'Usage: my-cli init [options] [command]\n' +
          '\n' +
          'Initialize project\n' +
          '\n' +
          'Options:\n' +
          '  --name, -n           Project name\n' +
          '  --description, -d    Project description\n' +
          '\n' +
          'I am footer\n'
        ]
      ]);

      asserts.deepEqual(consoleErrorSpy.calls, [
        ['error: Command not found: my-cli init c\n']
      ]);
    } finally {
      consoleLogSpy.restore();
      consoleErrorSpy.restore();
    }
  });

});

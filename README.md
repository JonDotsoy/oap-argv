# oap-argv

A modern command line argument parser.


```ts
const schema = {
  a: optionSchema(Boolean, ["-a"]),
  d: optionSchema(Array, ["-d"]),
};

const { commands, options } = parse(["-a", "-d=e1", "-d", "e2"], schema)

assert.deepEqual(commands, [])
assert.deepEqual(options, { a: true, d: [ "e1", "e2" ] })
```

**Features:**

- Zero dependencies module
- Module typed
- Deno compatible


## Guides





**Sample**

```ts
// My App
#!/usr/bin/env node

import {parse} from "oap-argv";
import {ActionControl} from "oap-argv/help/action";

const actionControl = new ActionControl()

actionControl.useAction("command", async (command:string, otherCommands:string[], options:Record<string,string|string[]|boolean>) => {
  console.log(`My command`)
  return 0;
});

const {commands, options, moreArgv} = parse(process.argv.splice(2));
const [command,...otherCommands] = commands;

process.exit(await actionControl.getAction(command, otherCommands, options));
```


```
my-cli command --flag value -- other-command --flag=234
[ 1  ] [ 2                ] [ 3                       ]


1) Part of command cli
2) Part of the commands and arguments
3) Used to read literal arguments
```

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
- Deno compatible
- Command handler manager


## Installation

Using NPM:

```shell
npm i oap-argv
```

In Node.JS:

```ts
import { parse, optionSchema } from "oap-argv"
import { CliManager } from "oap-argv/esm/cli-manager.js"
```

> For versions of NodeJS that do not support ECMAScript modules.
> ```ts
> const { parse, optionSchema } = require( "oap-argv/cjs/argv.js")
> const { CliManager } = require("oap-argv/cjs/cli-manager.js")
> ```

In Deno:


```ts
import { parse, optionSchema } from 'https://cdn.skypack.dev/oap-argv/esm/argv.js?dts';
import { CliManager } from 'https://cdn.skypack.dev/oap-argv/esm/cli-manager.js?dts';
```


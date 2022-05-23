import { parse, optionSchema } from "./argv.mjs"
import assert from "node:assert";
import test from 'node:test';

test("Should pass the argv as command", () => {
  const { commands } = parse(["--a", "--b", "--c"], {})

  assert.deepEqual(commands, ["--a", "--b", "--c"])
})

test("Should parse flags by the schema definition", ({ }) => {
  const schema = {
    a: optionSchema(Boolean, ["--a"]),
    d: optionSchema(Array, ["--d"]),
  };

  const { commands, options } = parse(["--a", "--b", "--c"], schema)

  assert.deepEqual(commands, ["--b", "--c"])
  assert.deepEqual(options, { a: true })
})

test('should parse option "string"', () => {
  const schema = {
    a: optionSchema(String, ["--a"]),
  };

  const { options } = parse(["--a", "hello"], schema)

  assert.deepEqual(options, { a: "hello" })
})

test('should parse option "number"', () => {
  const schema = {
    a: optionSchema(Number, ["--a"]),
  };

  const { options } = parse(["--a", "1"], schema)

  assert.deepEqual(options, { a: 1 })
})

test('should parse option "boolean"', () => {
  const schema = {
    a: optionSchema(Boolean, ["--a"]),
  };

  const { options } = parse(["--a"], schema)

  assert.deepEqual(options, { a: true })
});

test('should parse option "string[]"', () => {
  const schema = {
    a: optionSchema(Array, ["--a"]),
  };

  const { options } = parse(["--a", "hello", "--a", "world"], schema)
  assert.deepEqual(options, { a: ["hello", "world"] })
});


test('should split args', () => {
  const { commands, restArgv } = parse(["hello", "--", "world"])

  assert.deepEqual(commands, ["hello"])
  assert.deepEqual(restArgv, ["--", "world"])
})

test('should not split args', () => {
  const { commands, restArgv } = parse(["hello", "world"])

  assert.deepEqual(commands, ["hello", "world"])
  assert.deepEqual(restArgv, [])
})

test('should ignore the split args', () => {
  const { commands, restArgv } = parse(["hello", "--", "world", "--", "--", "--"], undefined, { splitSymbol: false })

  assert.deepEqual(commands, ["hello", "--", "world", "--", "--", '--'])
  assert.deepEqual(restArgv, [])
});

test('should declare custom split args', () => {
  const { commands, restArgv } = parse(["hi", "hello", "world", "--", "--", "--"], undefined, { splitSymbol: "hello" })

  assert.deepEqual(commands, ["hi"])
  assert.deepEqual(restArgv, ["hello", "world", "--", "--", "--"])
})

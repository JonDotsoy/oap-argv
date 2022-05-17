import { parse } from "./argv.mjs"
import assert from "node:assert";
// @ts-ignore
import test from 'node:test';

test("Should parse flags as commands", () => {
    const { commands } = parse(["--a", "--b", "--c"], [])

    assert.deepEqual(commands, ["--a", "--b", "--c"])
})

test("Should parse flags on schema", () => {
    const schema = [
        { name: "a", type: "boolean" as const, flags: ["--a"] },
    ];
    const { commands, options } = parse(["--a", "--b", "--c"], schema)

    assert.deepEqual(commands, ["--b", "--c"])
    assert.deepEqual(options, { a: true })
})

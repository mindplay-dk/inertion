`inertion` is a testing library that aims to be **simple** and **safe**.

It tries to honor the [Go language philosophy of testing](http://golang.org/doc/faq#How_do_I_write_a_unit_test) - paraphrasing:

> testing frameworks tend to develop into mini-languages of their own, with conditionals and controls and printing
> mechanisms, but JavaScript already has all those capabilities; why recreate them? We'd rather write tests in JavaScript;
> it's one fewer language to learn and the approach keeps the tests straightforward and easy to understand.

Unlike most test libraries, this one is not a *framework* - it does not automatically
collect your tests, run your tests, print results to the console, or do anything else.
This is a *library* - it doesn't do anything unless you call up it's functions.

Most test frameworks heavily rely on global state and side effects - things you
wouldn't accept in the code you're testing. Why don't we have the same expectations
for our testing tools? Because there is no shared state - because everything is literally
just functions - this library can even reliably test itself, with no workarounds.

The test harness [very small](https://github.com/mindplay-dk/inertion/blob/master/src/harness.ts),
and everything else is optional - the core of the package is *mostly types* that define
generic relationships between assertions, tests and their dependencies, and the results.

The package is fully self-contained (no dependencies) but internally bundles the following
popular packages, all of which have 30M+ downloads per week:

  * [`fast-deep-equal`](https://www.npmjs.com/package/fast-deep-equal) for equality assertions. (by default.)
  * [`pretty-format`](https://www.npmjs.com/package/pretty-format) to render values in reports. ([all plugins](https://github.com/facebook/jest/tree/main/packages/pretty-format/src/plugins) enabled + [ANSI serializer](jest-serializer-ansi-escapes) and some customizations.)
  * [`diff`](https://www.npmjs.com/package/diff) to highlight errors and required corrections in reports.
  * [`ansi-colors`](https://www.npmjs.com/package/ansi-colors) to color-code reports.

### Installation

Node 16+, CommonJS or ES6:

```
npm install inertion
```

Under Node, you can use `ts-node` to run tests directly. You can use `nyc` for code-coverage.
Have a look at `scripts` and `devDependencies` in `package.json` of this project for reference.

In Deno and modern browsers, you can use vanilla ES6 `import` from a CDN:

```js
import { setup, run } from "https://esm.sh/inertion";
```

### What do reports look like?

Arguably, the most important part of the developer experience when testing, is what happens when
your tests fail - a lot of time was invested here, and the built-in reporter has a number of
different layouts for different conditions, based on actual and expected values and types.

The output is minimally color-coded with errors highlighted in **red**, and the required
corrections highlighted in **green** - here are some examples:

![image](https://user-images.githubusercontent.com/103348/161727833-9f6c086f-1333-4803-8421-a99f9f98e945.png)

### What do tests look like?

A minimal test module calls `setup` and uses the resulting `test` function to add tests:

`hello.test.ts`
```ts
import { setup, assertions } from "inertion";

export const test = setup(assertions);

test(`hello world`, async is => {
  is.ok(true, "all good");
  is.equal(1, 2, "oh no, so wrong");
});
```

### What does an entry script look like?

A minimal test script will `run` the tests, and then most
likely exit with `statusOf(results)`:

```ts
import { run, printReport, statusOf } from "inertion";
import test from "./hello.test.ts";

(async () => {
  const results = await run(test);

  printReport(results);

  process.exit(statusOf(results));
})();
```

### Do I have to manually `import` each test?

Under Node.JS, you can use e.g. `fast-glob` or any library of your choice to
automatically locate your tests - adding this to your entry-script is literally
two lines of code:

```ts
import { run, printReport, statusOf } from "inertion";
import { test } from "./test/harness.js";
import glob from "fast-glob";
import process from "process";

(async () => {
  const files = glob.sync("**/*.test.ts", { absolute: true });

  await Promise.all(files.map(file => import(file)));

  const results = await run(test);

  printReport(results);

  process.exit(statusOf(results));
})();
```

##### Why isn't this just built-in?

- Because it's already *easy*, if you want it.
- Owning this bit of code gives you control over paths, filename conventions, etc.
- The library is intended to work in the browser - `glob` doesn't work in browsers.
- This allows you to use multiple test-harnesses with different assertions, context, etc.

### What if your tests have common dependencies?

You can provide a context factory to `setup` - every test will receive a new context from your factory function:

```ts
import { setup, assertions } from "inertion";

export const test = setup(assertions, () => ({
  get testSubject() {
    return new TestSubject("abc", [1,2,3]);
  }
}));

test(`hello world`, async (is, { testSubject }) => {
  is.ok(testSubject instanceof TestSubject, "all good");
});
```

### What are the built-in assertions?

The core philosophy of this package, is to have as few assertions as absolutely necessary - for
the most part, you will use `ok` and `equal` and familiar language constructs, rather than an
arsenal of assertions to replace those language constructs.

You can easily inject your own assertions - the library provides the following by default:

    is.ok(value)                    // value must strictly === true
    is.notOk(value)                 // value must strictly === false

    is.equal(actual, expected)      // deep equality test (using e.g. `fast-deep-equal` etc.)
    is.notEqual(actual, expected)   // deep non-equality

    is.same(actual, expected)       // strict sameness test (using `Object.is`)
    is.notSame(actual, expected)    // strict non-sameness

    is.passed()                     // manually pass a test
    is.failed()                     // manually fail

With every assertion, you can optionally provide additional details after the required arguments -
and it is considered best practice to at least include a string to explain *why* the assertion
should pass.

### How to test for expected exceptions?

Sticking to the philosophy of *use the language*, `is.passed` and `is.failed` should be used to
test for expected exceptions - the pattern is very simple:

```ts
test(`something`, async is => {
  try {
    await thisShouldThrow();

    is.failed("oh no, it didn't throw!");
  } catch (e) {
    is.ok(error.message.includes("words"), "it should throw!");
  }
});
```

(The benefit of using this pattern, is it works with `async` and `await` and survives refactoring
between `async` and non-`async`, without having to switch between different assertions.)

### Why should I care?

This library is very open-ended - there are almost no decisions baked-in.

* **Want different assertions?** Provide your own assertion functions to `setup`.
* **Need some test helpers or mocks or whatever?** Use context factory-functions.
* **Have different tests with different needs?** Create as many `test` functions as needed, with different assertions and context functions.

#### Have any other special needs?

This is truly just a library: assertions, reporters and test-runners are *just functions* -
use as much or as little as you need, import from third-party libraries, or write your own.

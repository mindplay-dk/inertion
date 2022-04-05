This library aims to be the simplest, most unopionated testing library for Typescript.

It tries to honor the [Go language philosophy of testing](http://golang.org/doc/faq#How_do_I_write_a_unit_test) - paraphrasing:

> testing frameworks tend to develop into mini-languages of their own, with conditionals and controls and printing
> mechanisms, but JavaScript already has all those capabilities; why recreate them? We'd rather write tests in JavaScript;
> it's one fewer language to learn and the approach keeps the tests straightforward and easy to understand.

Unlike most test libraries, this one is not a *framework* - it does not automatically
collect your tests, run your tests, print results to the console, or anything else.
This is a *library* - it doesn't do anything without your say-so.

Most test frameworks heavily rely on global state and side effects - things you
wouldn't accept in the code you're testing. Why don't we have the same expectations
for our testing tools? Because there is no shared state - because everything is literally
just functions - this library can even reliably test itself, with no workarounds.

The test harness is ~50 lines of code - everything else is optional, and the core of
this package is really *mostly types* to support you in writing fast, robust, consistent
and predictable test-suites.

**What do tests look like?**

A minimal test module calls `setup` and uses the resulting `test` function to create tests:

`hello.test.ts`
```ts
import { setup, assertions } from "inertion";

const test = setup(assertions);

export default test(`hello world`, async is => {
  is.ok(true, "all good");
  is.equal(1, 2, "oh no, so wrong");
});
```

**What does an entry script look like?**

A minimal test script will `run` the tests, and then , and will most
likely exit with `statusOf(results)`:

```ts
import { run } from "inertion";
import { printReport, statusOf } from "inertion";
import helloWorld from "./hello.test.ts";

(async () => {
  const results = await run([helloWorld]);

  printReport(results);

  process.exit(statusOf(results));
})();
```

**What if your tests have common dependencies?**

You can provide a context factory to `setup` - every test will receive a new context from your factory function:

```ts
import { setup, assertions } from "inertion";

const test = setup(assertions, () => ({
  get testSubject() {
    return new TestSubject("abc", [1,2,3]);
  }
}));

export default test(`hello world`, async (is, { testSubject }) => {
  is.ok(testSubject instanceof TestSubject, "all good");
});
```

**What are the built-in assertions?**

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

**How to test for expected exceptions?**

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

**Why should I care?**

This library is very open-ended - there are almost no decisions baked-in.

* **Want different assertions?** Provide your own assertion functions to `setup`.
* **Need some test helpers or mocks or whatever?** Use context factory-functions.
* **Have different tests with different needs?** Create as many `test` functions as needed, with different assertions and context functions.

**Have any other special needs?**

This is truly just a library: assertions, reporters and test-runners are *just functions* -
use as much or as little as you need, import from third-party libraries, or write your own.

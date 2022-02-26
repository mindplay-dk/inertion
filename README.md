This library aims to be the simplest, most unopionated testing library for Typescript.

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
import { setup } from "testlib";
import * as assertions from "testlib/assertions";

const test = setup(assertions);

export default test(`hello world`, async is => {
  is.ok(true, "all good");
  is.equal(1, 2, "oh no, so wrong");
});
```

**What does an entry script look like?**

A minimal test script will `run` the tests, might `reportTo` the `console`, and will most
likely exit with `statusOf(results)`:

```ts
import { run } from "testlib";
import { report, statusOf } from "testlib/report";
import helloWorld from "./hello.test.ts";

(async () => {
  const results = await run([helloWorld]);

  reportTo(console, results);

  process.exit(statusOf(results));
})();
```

**What if your tests have common dependencies?**

You can provide a context factory to `setup` - every test will receive a new context from your factory function:

```ts
import { setup } from "testlib";
import * as assertions from "testlib/assertions";

const test = setup(assertions, () => ({
  get testSubject() {
    return new TestSubject("abc", [1,2,3]);
  }
}));

export default test(`hello world`, async (is, { testSubject }) => {
  is.ok(testSubject instanceof TestSubject, "all good");
});
```

**Why should I care?**

This library is very open-ended - there are almost no decisions baked-in.

* **Want different assertions?** Provide your own assertion functions to `setup`.
* **Need some test helpers or mocks or whatever?** Use context factory-functions.
* **Have different tests with different needs?** Create as many `test` functions as needed, with different assertions and context functions.

**Have any other special needs?**

This is truly just a library: assertions, reporters and test-runners are *just functions* -
use as much or as little as you need, import from third-party libraries, or write your own.

import { assertion, assertions } from "../src/assertions";
import { setup } from "../src/harness";

export const passingTest = setup(assertions);

passingTest(`this is a test`, async is => {
  is.equal(1, 1, "one is one");
  is.ok(true, "true is true");
});

export const failingTest = setup(assertions);

failingTest(`this is another test`, async is => {
  is.ok(true, "this will succeed");
  is.ok(false, "this will fail");
});

export const createTestWithContext = () => {
  let number = 1;

  const test = setup(assertions, () => ({ number: number++ }));

  test(`test with context`, async (is, { number }) => {
    is.equal(number, number);
  });

  return test;
}

const even = assertion("even", (num: number) => num % 2 === 0);

export const testWithCustomAssertion = setup({ ...assertions, even })

testWithCustomAssertion(`custom assertion`, async is => {
  is.even(2, "ok", "sure");
  is.even(1, "nope");
});

export const testWithUnexpectedError = setup({});

testWithUnexpectedError(`unexpected error`, async is => {
  throw new Error(`oh no`);
});

export const testWithUnexpectedUnknownError = setup({});

testWithUnexpectedUnknownError(`unexpected unknown error`, async is => {
  throw "oh no";
});

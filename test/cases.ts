import { assertion, assertions } from "../src/assertions";
import { setup } from "../src/harness";

const even = assertion("even", (num: number) => num % 2 === 0);

const test = setup({ ...assertions, even });

export const passingTest = test(`this is a test`, async is => {
  is.equal(1, 1, "one is one");
  is.ok(true, "true is true");
});

export const failingTest = test(`this is another test`, async is => {
  is.ok(true, "this will succeed");
  is.ok(false, "this will fail");
});

export const createTestWithContext = () => {
  let number = 1;

  const test = setup(assertions, () => ({ number: number++ }));

  return test(`test with context`, async (is, { number }) => {
    is.equal(number, number);
  });
}

export const createTestWithCustomAssertion = test(`custom assertion`, async is => {
  is.even(2, "ok", "sure");
  is.even(1, "nope");
});

export const testWithUnexpectedError = test(`unexpected error`, async is => {
  throw new Error(`oh no`);
});

export const testWithUnexpectedUnknownError = test(`unexpected unknown error`, async is => {
  throw "oh no";
});

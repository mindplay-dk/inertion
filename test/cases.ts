import * as assertions from "../src/assertions";
import { setup } from "../src/harness";

const test = setup(assertions);

export const passingTest = test(`this is a test`, async is => {
  is.equal(1, 1, "one is one");
  is.ok(true, "true is true");
});

export const failingTest = test(`this is another test`, async is => {
  is.ok(true, "this will succeed");
  is.ok(false, "this will fail");
});

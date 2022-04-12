import { setup, assertions } from "inertion";
import { add } from "./add.js";

export const test = setup(assertions);

test(`can add numbers`, async is => {
  is.equal(add(1, 2), 3);
});

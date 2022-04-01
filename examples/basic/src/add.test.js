import { setup, assertions } from "inertion";

const test = setup(assertions);

export default test(`can add numbers`, async is => {
  is.equal(add(1, 2), 3);
});

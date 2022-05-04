import { run, printReport, statusOf } from "inertion";
import { test } from "./src/add.test.js";

(async () => {
  const results = await run(test);

  printReport(results);

  process.exit(statusOf(results));
})();

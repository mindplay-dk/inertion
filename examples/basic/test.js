import { run } from "inertion";
import { printReport, statusOf } from "inertion";
import add from "./src/add.test.js";

(async () => {
  const results = await run([add]);

  printReport(results);

  process.exit(statusOf(results));
})();

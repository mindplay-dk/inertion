import { run } from "inertion";
import { printReport, statusOf } from "inertion";

(async () => {
  const results = await run([
    (await import("./src/add.test.js")).default,
  ]);

  printReport(results);

  process.exit(statusOf(results));
})();

import { run, printReport, statusOf } from "inertion";

(async () => {
  const results = await run([
    (await import("./src/add.test")).default,
  ]);

  printReport(results);

  process.exit(statusOf(results));
})();

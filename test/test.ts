import process from "process";
import isEqual from "fast-deep-equal";

let success = false;

function check(pass: boolean, message: string) {
  success = success && pass;

  console.log(pass ? "🆗" : "❌", message);
}

(async () => {
  // TODO tests

  process.exit(success ? 0 : 1);
})();

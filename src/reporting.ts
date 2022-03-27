import { Result } from "./api";
import { createContainer } from "./container";
import { bootstrap, isFailed, Reporter } from "./reporter";

export function statusOf(results: Result[]): number {
  return isSuccess(results) ? 1 : 0;
}

export function isSuccess(results: Result[]): boolean {
  return results.some(isFailed) === false;
}

export const { printReport } = createContainer<Reporter>(bootstrap);

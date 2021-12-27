import { Result } from "./api";

export interface TestStarted {
  type: "TestStarted";
  description: string;
}

export interface TestEnded {
  type: "TestEnded";
  // TODO time
}

export interface Asserted {
  type: "Asserted";
  result: Result;
}

export type Message = TestStarted | TestEnded | Asserted;

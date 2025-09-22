import { connect } from "../index.js";

export function testConnect(appName: string) {
  return connect(appName, "postgresql://postgres:postgres@localhost:45432/colony");
}

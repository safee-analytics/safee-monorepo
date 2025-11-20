import { connect } from "../index.js";

export function testConnect(appName: string) {
  return connect(appName, "postgresql://safee:safee@localhost:25432/safee");
}

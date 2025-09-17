import { Controller } from "tsoa";
interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}
export declare class HealthController extends Controller {
  getHealth(): Promise<HealthResponse>;
}
export {};
//# sourceMappingURL=healthController.d.ts.map

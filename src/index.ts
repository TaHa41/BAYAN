import {handle} from "./v3/app";

export default {
  fetch(req: Request, env: any, ctx: ExecutionContext) {
    return handle({request: req, env, ctx});
  },
  async scheduled(_event: ScheduledEvent, _env: any, _ctx: ExecutionContext) {
    // V3 scheduled hook is intentionally safe and side-effect free until the
    // production audit/repair queue is enabled.
  }
} satisfies ExportedHandler;
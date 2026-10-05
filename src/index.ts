import {handle} from "./v3/app";

export default {
  fetch(req: Request, env: any, ctx: ExecutionContext) {
    return handle({request: req, env, ctx});
  },
  async scheduled(_controller: ScheduledController, _env: any, _ctx: ExecutionContext) {
    // Scheduler is kept side-effect free until the audited repair queue is enabled.
  }
} satisfies ExportedHandler;

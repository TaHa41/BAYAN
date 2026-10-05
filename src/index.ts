import {handle} from "./v3/app";
export default {fetch(req:Request,env:any,ctx:ExecutionContext){return handle({request:req,env,ctx})}} satisfies ExportedHandler;

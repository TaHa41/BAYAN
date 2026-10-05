import {json} from "../http"; import {FEATURES} from "../core/config";
export function health(){return json({ok:true,service:"BAYAN",version:FEATURES.version})}
export function features(){return json(FEATURES)}

import { Orchestrator } from "@holochain/tryorama";
import xyzzy from "./xyzzy";

let orchestrator = new Orchestrator();
xyzzy(orchestrator);
orchestrator.run();
/*
orchestrator = new Orchestrator()
require('./profile')(orchestrator)
orchestrator.run()
*/

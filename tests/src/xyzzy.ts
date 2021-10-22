import { Orchestrator, Config, InstallAgentsHapps } from '@holochain/tryorama'
import path from 'path'
import * as _ from 'lodash'
import { RETRY_DELAY, RETRY_COUNT, localConductorConfig, networkedConductorConfig, installAgents, awaitIntegration, delay } from './common'
import { Base64 } from "js-base64";

function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}
export default async (orchestrator) => {

  orchestrator.registerScenario('xyzzy basic tests', async (s, t) => {
    // Declare two players using the previously specified config, nicknaming them "alice" and "bob"
    // note that the first argument to players is just an array conductor configs that that will
    // be used to spin up the conductor processes which are returned in a matching array.
    const [a_and_b_conductor] = await s.players([localConductorConfig])

    a_and_b_conductor.setSignalHandler((signal) => {
      console.log("Received Signal:",signal)
      t.deepEqual(signal.data.payload.message, { type: 'NewZthing', content: { name: 'foobar', meta: {} } })
    })

    // install your happs into the conductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    let [alice_xyzzy_happ/*, bobbo_xyzzy_happ*/] = await installAgents(a_and_b_conductor, ["alice"/*, 'bobbo'*/])
    const [alice_xyzzy] = alice_xyzzy_happ.cells
//    const [bobbo_xyzzy] = bobbo_xyzzy_happ.cells

    // Create a zthing
    let zthing1 = {
      name: "foobar",
      meta: {}
    };

    const zthing1_hash = await alice_xyzzy.call('hc_zome_xyzzy', 'create_zthing', zthing1 );
    t.ok(zthing1_hash)
    console.log("zthing1_hash", zthing1_hash);

    const zthings = await alice_xyzzy.call('hc_zome_xyzzy', 'get_zthings', null );
    console.log(zthings);
    t.deepEqual(zthings, [{hash: zthing1_hash, content: zthing1}]);
  })
}

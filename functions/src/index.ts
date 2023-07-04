import { setGlobalOptions } from 'firebase-functions/v2/options';

// Set the maximum instances to 10 for all functions
setGlobalOptions({ maxInstances: 10 });

export { onCallAddDeployedContract } from './on-call-add-deployed-contract';
export { onCallUpdateDeployedContract } from './on-call-update-deployed-contract';
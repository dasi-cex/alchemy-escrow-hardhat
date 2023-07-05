import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { ContractRecord } from '../../shared-models/contracts/contract-record.model';
import { FbCollectionPaths } from '../../shared-models/routes-and-paths/fb-collection-paths.model';
import { firestoreDb } from './config';
import { ContractProperties } from '../../shared-models/contracts/contract-properties.model';
import { Timestamp } from 'firebase-admin/firestore';



const updateDeployedContractToFs = async (partialContractProperties: Partial<ContractProperties>) => {
  const contractCollectionRef = firestoreDb().collection(FbCollectionPaths.CONTRACTS);
  const updatedContractRecord: Partial<ContractRecord> = {
    ...partialContractProperties,
    lastUpdatedAt: Timestamp.now()
  };

  const writeResult = await contractCollectionRef.doc(partialContractProperties.address as string).update(updatedContractRecord)
    .catch(err => {logger.log(`Failed to add contractRecord to firestore db`, err); throw new HttpsError('unknown', err);});

  return writeResult.writeTime;
}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallUpdateDeployedContract = onCall( async (request: CallableRequest<Partial<ContractProperties>>): Promise<Timestamp> => {
  const partialContractProperties = request.data;
  if (!partialContractProperties.address) {
    throw new HttpsError('unknown', 'No contract address found on contract properties. Terminating function');
  }
  logger.log('onCallUpdateDeployedContract request received with this data:', partialContractProperties);
  return updateDeployedContractToFs(partialContractProperties);
});
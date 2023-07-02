import { CallableRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { ContractRecord } from '../../shared-models/contracts/contract-record.model';
import { FbCollectionPaths } from '../../shared-models/routes-and-paths/fb-collection-paths.model';
import { firestoreDb } from './config';
import { ContractProperties } from '../../shared-models/contracts/contract-properties.model';
import { Timestamp } from 'firebase-admin/firestore';



const addDeployedContractToFs = async (contractProperties: ContractProperties) => {
  const contractCollectionRef = firestoreDb().collection(FbCollectionPaths.Contracts);
  const contractRecord: ContractRecord = {
    ...contractProperties,
    createdAt: Timestamp.now()
  };

  const writeResult = await contractCollectionRef.doc(contractRecord.address).set(contractRecord)
    .catch(err => {logger.log(`Failed to add contractRecord to firestore db`, err); throw new HttpsError('unknown', err);});

  return writeResult.writeTime;
}

/////// DEPLOYABLE FUNCTIONS ///////

export const onCallAddDeployedContract = onCall( async (request: CallableRequest<ContractProperties>): Promise<Timestamp> => {
  const contractProperties = request.data;
  logger.log('onCallAddDeployedContract request received with this data:', contractProperties);
  return addDeployedContractToFs(contractProperties);
});
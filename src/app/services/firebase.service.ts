import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { Observable, catchError, map, shareReplay, take, throwError } from 'rxjs';
import { ContractProperties } from 'shared-models/contracts/contract-properties.model';
import { ContractRecord } from 'shared-models/contracts/contract-record.model';
import { FbCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { FbFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private firestore: Firestore = inject(Firestore);
  private functions: Functions = inject(Functions);

  constructor() { }

  addDeployedContract(contractProperties: ContractProperties): Observable<ContractProperties> {
    console.log('Submitting addDeployedContract to server with this data', contractProperties);

    const addDeployedContractHttpCall: (data: ContractProperties) => Observable<Timestamp> = httpsCallableData(
      this.functions,
      FbFunctionNames.ON_CALL_ADD_DEPLOYED_CONTRACT
    );
    const res = addDeployedContractHttpCall(contractProperties)
      .pipe(
        take(1),
        map(writeResponse => {
          console.log('Added this contract to database:', contractProperties);
          if (!writeResponse) {
            throw new Error(`Error adding contract to database.`);
          }
          return contractProperties;
        }),
        shareReplay(),
        catchError(error => {
          return throwError(() => new Error(error));
        })
      );

    return res;
  }

  updateDeployedContract(partialContractProperties: Partial<ContractProperties>) {
    console.log('Submitting updateDeployedContract to server with this data', partialContractProperties);

    const updateDeployedContractHttpCall: (data: Partial<ContractProperties>) => Observable<Timestamp> = httpsCallableData(
      this.functions,
      FbFunctionNames.ON_CALL_UPDATE_DEPLOYED_CONTRACT
    );
    const res = updateDeployedContractHttpCall(partialContractProperties)
      .pipe(
        take(1),
        map(writeResponse => {
          console.log('Updated this contract in database:', partialContractProperties);
          if (!writeResponse) {
            throw new Error(`Error updating this contract in database.`);
          }
          return partialContractProperties;
        }),
        shareReplay(),
        catchError(error => {
          return throwError(() => new Error(error));
        })
      );

    return res;
  }

  fetchSingleDeployedContract(contractAddress: string): Observable<ContractRecord> {
    const contractRef = doc(this.firestore, FbCollectionPaths.Contracts, contractAddress);
    return docData(contractRef)
      .pipe(
        map(contractRecord => {
          console.log('Fetched contract record', contractRecord);
          return contractRecord as ContractRecord
        })
      );
  }

  fetchDeployedContracts(): Observable<ContractRecord[]> {
    const contractsCollection = collection(this.firestore, FbCollectionPaths.Contracts);
    const contractCollectionData = collectionData(contractsCollection) as Observable<ContractRecord[]>;
    return contractCollectionData
      .pipe(
        map(contracts => {
          console.log('Fetched all contracts')
          return contracts;
        }),
        shareReplay(),
        catchError( error => {
          console.log('Error fetching deployed contracts from Firebase', error);
          return throwError(() => new Error(error));
        })
      )
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { Firestore, Timestamp, collection, collectionData, doc, docData } from '@angular/fire/firestore';
import { Functions, httpsCallableData } from '@angular/fire/functions';
import { Observable, catchError, map, shareReplay, take, throwError } from 'rxjs';
import { ContractProperties } from 'shared-models/contracts/contract-properties.model';
import { ContractRecord } from 'shared-models/contracts/contract-record.model';
import { FbCollectionPaths } from 'shared-models/routes-and-paths/fb-collection-paths.model';
import { FbFunctionNames } from 'shared-models/routes-and-paths/fb-function-names.model';

enum LocalFbCollectionPaths {
  ON_CALL_ADD_DEPLOYED_CONTRACT = 'onCallAddDeployedContract'
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private firestore: Firestore = inject(Firestore);
  private functions: Functions = inject(Functions);

  addDeployedContractError$ = signal<string | undefined>(undefined);
  addDeployedContractProcessing$ = signal<boolean>(false);

  updateDeployedContractError$ = signal<string | undefined>(undefined);
  updateDeployedContractProcessing$ = signal<boolean>(false);
  
  fetchDeployedContractsError$ = signal<string | undefined>(undefined);
  fetchDeployedContractsProcessing$ = signal<boolean>(false);

  constructor() { }

  addDeployedContract(contractProperties: ContractProperties): Observable<ContractProperties> {
    console.log('Submitting addDeployedContract to server with this data', contractProperties);
    this.addDeployedContractError$.set(undefined);
    this.addDeployedContractProcessing$.set(true);
    console.log('Will deploy to this function name', LocalFbCollectionPaths.ON_CALL_ADD_DEPLOYED_CONTRACT);

    const addDeployedContractHttpCall: (data: ContractProperties) => Observable<Timestamp> = httpsCallableData(
      this.functions,
      LocalFbCollectionPaths.ON_CALL_ADD_DEPLOYED_CONTRACT
    );
    const res = addDeployedContractHttpCall(contractProperties)
      .pipe(
        take(1),
        map(writeResponse => {
          console.log('Added this contract to database:', contractProperties);
          if (!writeResponse) {
            throw new Error(`Error adding contract to database.`);
          }
          this.addDeployedContractProcessing$.set(false);
          return contractProperties;
        }),
        shareReplay(),
        catchError(error => {
          this.addDeployedContractError$.set(error);
          return throwError(() => new Error(error));
        })
      );

    return res;
  }

  updateDeployedContract(partialContractProperties: Partial<ContractProperties>) {
    console.log('Submitting updateDeployedContract to server with this data', partialContractProperties);
    this.updateDeployedContractError$.set(undefined);
    this.updateDeployedContractProcessing$.set(true);

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
          this.updateDeployedContractProcessing$.set(false);
          return partialContractProperties;
        }),
        shareReplay(),
        catchError(error => {
          this.updateDeployedContractError$.set(error);
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
    console.log('Fetching all deployed contracts');
    this.fetchDeployedContractsError$.set(undefined);
    this.fetchDeployedContractsProcessing$.set(true);
    const contractsCollection = collection(this.firestore, FbCollectionPaths.Contracts);
    const contractCollectionData = collectionData(contractsCollection) as Observable<ContractRecord[]>;
    return contractCollectionData
      .pipe(
        map(contracts => {
          console.log('Fetched all deployed contracts')
          this.fetchDeployedContractsProcessing$.set(false);
          return contracts;
        }),
        shareReplay(),
        catchError( error => {
          console.log('Error fetching deployed contracts from Firebase', error);
          this.fetchDeployedContractsError$.set(error);
          return throwError(() => new Error(error));
        })
      )
  }
}

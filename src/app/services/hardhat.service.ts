import { Injectable, NgZone, signal } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider'
import { BigNumber, ethers } from 'ethers';
import { Observable, ReplaySubject, catchError, combineLatest, from, map, shareReplay, switchMap, take, tap, throwError, withLatestFrom } from 'rxjs';
import Escrow from '../artifacts/contracts/Escrow.sol/Escrow.json';
import { ContractProperties } from 'shared-models/contracts/contract-properties.model';

@Injectable({
  providedIn: 'root'
})
export class HardhatService {

  connectedAddress$ = signal<string>('No wallet connected.');
  existingContractProperties$: ReplaySubject<ContractProperties> = new ReplaySubject(1); // Using ReplaySubject(1) to initialize with no value and also ensure withLatestFrom below provides a value

  approveEscrowError$ = signal<string | undefined>(undefined);
  approveEscrowProcessing$ = signal<boolean>(false);
  approveEscrowSuccessful$ = signal<boolean>(false);

  deployContractError$ = signal<string | undefined>(undefined);
  deployContractProcessing$ = signal<boolean>(false);
  deployContractSuccessful$ = signal<boolean>(false);


  constructor(
    private ngZone: NgZone
  ) { 
    this.configureProviderAndAddresses();
  }

  deployContract(arbiter: string, beneficiary: string, value: BigNumber) {
    this.deployContractError$.set(undefined);
    this.deployContractProcessing$.set(true);

    return from(detectEthereumProvider())
      .pipe(
        take(1),
        switchMap(metamaskProvider => {
          const ethersProvider = new ethers.providers.Web3Provider((metamaskProvider as any));
          // const ethersProvider = new ethers.providers.Web3Provider(('metamaskProvider' as any));
          console.log('Creating contract factory with this signer', ethersProvider.getSigner());
          const factory = new ethers.ContractFactory(Escrow.abi, Escrow.bytecode, ethersProvider.getSigner());
          return factory.deploy(arbiter, beneficiary, {value});
        }),
        switchMap(contract => {
          return contract.deployTransaction.wait();
        }),
        map(transactionReceipt => {
          console.log('Contract deployed to:', transactionReceipt.transactionHash);
          this.setContractProperties(transactionReceipt.contractAddress);
          this.deployContractProcessing$.set(false);
          this.deployContractSuccessful$.set(true);
          return transactionReceipt;
        }),
        shareReplay(),
        catchError(error => {
          const errMsg = this.extractEvmErrorMessageText(error.message);
          this.deployContractError$.set(errMsg);
          this.deployContractProcessing$.set(false);
          return throwError(() => new Error(errMsg));
        })
      )
  }

  approveEscrowTransfer(): Observable<ethers.providers.TransactionReceipt> {
    this.approveEscrowError$.set(undefined);
    this.approveEscrowProcessing$.set(true);
    
    return from(detectEthereumProvider())
      .pipe(
        withLatestFrom(this.existingContractProperties$),
        take(1),
        switchMap(([metamaskProvider, contractProperties]) => {
          console.log('Processing approve escrow transfer with these contract properties', contractProperties);
          const ethersProvider = new ethers.providers.Web3Provider((metamaskProvider as any));
          const contract = new ethers.Contract(contractProperties.address, Escrow.abi, ethersProvider.getSigner());
          this.monitorEscrowApproval(contract);
          const approveTx = contract['approve'].call() as Promise<ethers.providers.TransactionResponse>;
          return approveTx;
        }),
        switchMap(approveTx => {
          return approveTx.wait();
        }),
        map(transactionReceipt => {
          console.log('Transaction mined with hash:', transactionReceipt.transactionHash);
          return transactionReceipt;
        }),
        shareReplay(),
        catchError(error => {
          const errMsg = this.extractEvmErrorMessageText(error.message);
          this.approveEscrowError$.set(errMsg);
          this.approveEscrowProcessing$.set(false);
          return throwError(() => new Error(error));
        })
      )
  }

  resetContractState() {
    this.approveEscrowError$.set(undefined);
    this.approveEscrowProcessing$.set(false);
    this.approveEscrowSuccessful$.set(false);

    this.deployContractError$.set(undefined);
    this.deployContractProcessing$.set(false);
    this.deployContractSuccessful$.set(false);

    this.existingContractProperties$.complete();
    this.existingContractProperties$ = new ReplaySubject(1);
  }

  private setContractProperties(contractAddress: string) {
    from(detectEthereumProvider())
      .pipe(
        switchMap(metamaskProvider => {
          const ethersProvider = new ethers.providers.Web3Provider((metamaskProvider as any));
          const contract = new ethers.Contract(contractAddress, Escrow.abi, ethersProvider.getSigner());
          return combineLatest([
            contract['arbiter'].call() as Promise<string>, 
            contract['beneficiary'].call() as Promise<string>, 
            contract['depositor'].call() as Promise<string>,
            ethersProvider.getBalance(contractAddress) as Promise<BigNumber>
          ])
        }),
        map(([arbiter, beneficiary, depositor, value]) => {
          const valueInEth = ethers.utils.formatEther(value);
          const contractProperties: ContractProperties = {
            arbiter,
            beneficiary,
            depositor,
            value: valueInEth,
            address: contractAddress
          }
          console.log('Fetched these contract properties', contractProperties);
          this.existingContractProperties$.next(contractProperties);
          this.existingContractProperties$.next(contractProperties);
        }),
        shareReplay(),
        catchError(error => {
          const errMsg = this.extractEvmErrorMessageText(error.message);
          return throwError(() => new Error(errMsg));
        })
      ).subscribe();
  }

  // This makes the provider and addresses available to the application
  private configureProviderAndAddresses() {
    from(detectEthereumProvider())
      .pipe(
        switchMap(metamaskProvider => {
          const ethersProvider = new ethers.providers.Web3Provider((metamaskProvider as any));
          this.monitorProviderChanges(metamaskProvider);
          return this.requestProviderAccounts(ethersProvider);
        }),
        tap(accounts => {
          this.initializeCurrentAccount(accounts);
        }),
        shareReplay(),
        catchError( error => {
          console.log('Error fetching provider info', error);
          const errMsg = this.extractEvmErrorMessageText(error.message);
          return throwError(() => new Error(errMsg));
        })
        
      ).subscribe();
  }

  // Initialize the listener for changes to the provider account
  private monitorProviderChanges(metamaskProvider: any) {
    metamaskProvider?.on('accountsChanged', (accounts: string[]) => {
      // Running this inside of ngZone because otherwise the change detection isn't triggered on observable update
      this.ngZone.run(() => {
        this.connectedAddress$.set(accounts[0]); // Update the accounts
        console.log('New connected address is:', this.connectedAddress$());
      })
    })
  };

  // Create a request for the provider accounts
  private requestProviderAccounts(ethersProvider: ethers.providers.Web3Provider): Observable<string[]> {
    const currentAccounts: Promise<string[]> = ethersProvider.send('eth_requestAccounts', []); // This triggers a request to connect a wallet
    return from(currentAccounts);
  }

  // Set the initial state of the provider account
  private initializeCurrentAccount(accounts: string[]) {
    this.connectedAddress$.set(accounts[0]); // Update the accounts
    console.log('Initial connected address is: ', this.connectedAddress$());
  }

  private monitorEscrowApproval(contract: ethers.Contract) {
    contract.on('Approved', (balance: number) => {
      this.ngZone.run(() => {
        this.approveEscrowProcessing$.set(false);
        this.approveEscrowSuccessful$.set(true);
        console.log('Contract emitted the Approved event!', balance);
      })
    });
  }

  private extractEvmErrorMessageText(errorMessage: string): string {
    const regex = new RegExp(/reason="(.*?)"/g);
    const match = regex.exec(errorMessage);
    if (match) {
      return match[1];
    } else {
      return `The transaction reverted for an unknown reason!`;
    }
  }
  
}

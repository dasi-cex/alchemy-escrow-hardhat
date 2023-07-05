import { Injectable, NgZone, signal } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider'
import { BigNumber, ethers } from 'ethers';
import Escrow from '../artifacts/contracts/Escrow.sol/Escrow.json';
import { ContractProperties } from 'shared-models/contracts/contract-properties.model';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class EvmService {

  connectedAddress$ = signal<string>('No wallet connected.');
  existingContractProperties$ = signal<ContractProperties | undefined>(undefined);

  approveEscrowError$ = signal<string | undefined>(undefined);
  approveEscrowProcessing$ = signal<boolean>(false);

  deployContractError$ = signal<string | undefined>(undefined);
  deployContractProcessing$ = signal<boolean>(false);
  deployContractSuccessful$ = signal<boolean>(false);

  currentProvider$ = signal<ethers.providers.Web3Provider | undefined>(undefined);
  currentContract$ = signal<ethers.Contract | undefined>(undefined);

  constructor(
    private ngZone: NgZone,
    private firebaseService: FirebaseService
  ) { 
    this.configureProviderAndAddresses();
  }

  // Deploys the contract and adds it to the database
  async deployContract(arbiter: string, beneficiary: string, value: BigNumber) {
    this.deployContractError$.set(undefined);
    this.deployContractSuccessful$.set(false);
    this.deployContractProcessing$.set(true);

    const factory = new ethers.ContractFactory(Escrow.abi, Escrow.bytecode, this.currentProvider$()!.getSigner());
    console.log('Creating contract factory with this signer', this.currentProvider$()!.getSigner());
    
    const contract = await factory.deploy(arbiter, beneficiary, {value})
      .catch(error => {
        this.deployContractError$.set(this.extractEvmErrorMessageText(error.message));
        this.deployContractProcessing$.set(false);
        throw new Error(`Error deploying contract: ${this.extractEvmErrorMessageText(error.message)}`);
      });
  
    this.currentContract$.set(contract);

    const transactionReceipt = await contract.deployTransaction.wait()
      .catch(error => {
        this.deployContractError$.set(this.extractEvmErrorMessageText(error.message));
        this.deployContractProcessing$.set(false);
        throw new Error(`Error waiting for transaction to confirm: ${this.extractEvmErrorMessageText(error.message)}`);
      });
    
    this.fetchContractProperties(transactionReceipt.contractAddress);
    this.deployContractProcessing$.set(false);
    this.deployContractSuccessful$.set(true);
    const contractProperties: ContractProperties = {
      address: transactionReceipt.contractAddress,
      approved: false,
      arbiter,
      beneficiary,
      depositor: this.connectedAddress$(),
      value: ethers.utils.formatEther(value)
    }
    return this.firebaseService.addDeployedContract(contractProperties);
  }

  async approveEscrowTransfer() {
    console.log('Testing approveEscrowTransfer');
    this.approveEscrowError$.set(undefined);
    this.approveEscrowProcessing$.set(true);
    console.log('Calling approveEscrowTransfer with this signer', await this.currentProvider$()!.getSigner().getAddress())
    this.monitorEscrowApproval(this.currentContract$()!);
    
    // Somehow this specific call triggers a call from Address 1 even though it is called by address 2. No fix found.
    const approveTx = await (this.currentContract$()!['approve'].call() as Promise<ethers.providers.TransactionResponse>)
      .catch(error => {
        this.approveEscrowError$.set(this.extractEvmErrorMessageText(error.message));
        this.approveEscrowProcessing$.set(false);
        throw new Error(`Error calling 'approve' on contract: ${this.extractEvmErrorMessageText(error.message)}`);
      });
    
    const transactionReceipt = await approveTx?.wait()
      .catch(error => {
        this.approveEscrowError$.set(this.extractEvmErrorMessageText(error.message));
        this.approveEscrowProcessing$.set(false);
        throw new Error(`Error waiting for transaction to confirm: ${this.extractEvmErrorMessageText(error.message)}`);
      });

    return transactionReceipt;
  }

  resetContractState() {
    this.approveEscrowError$.set(undefined);
    this.approveEscrowProcessing$.set(false);

    this.deployContractError$.set(undefined);
    this.deployContractProcessing$.set(false);
    this.deployContractSuccessful$.set(false);

    this.existingContractProperties$.set(undefined);
  }

  async fetchContractProperties(contractAddress: string) {
    console.log('Calling setContractProperties with this signer', await this.currentProvider$()!.getSigner().getAddress())
    const contract = new ethers.Contract(contractAddress, Escrow.abi, this.currentProvider$()!.getSigner());
    this.currentContract$.set(contract);
    const arbiter = await (this.currentContract$()!['arbiter'].call() as Promise<string>)
      .catch(error => {throw this.extractEvmErrorMessageText(error.message)});
    const beneficiary = await (this.currentContract$()!['beneficiary'].call() as Promise<string>)
      .catch(error => {throw this.extractEvmErrorMessageText(error.message)});
    const depositor = await (this.currentContract$()!['depositor'].call() as Promise<string>)
      .catch(error => {throw this.extractEvmErrorMessageText(error.message)});
    const approved = await (this.currentContract$()!['isApproved'].call() as Promise<boolean>)
      .catch(error => {throw this.extractEvmErrorMessageText(error.message)});
    const value = await (this.currentProvider$()!.getBalance(contractAddress) as Promise<BigNumber>)
      .catch(error => {throw this.extractEvmErrorMessageText(error.message)});
    const valueInEth = ethers.utils.formatEther(value);
    const contractProperties: ContractProperties = {
      arbiter,
      beneficiary,
      depositor,
      approved,
      value: valueInEth,
      address: contractAddress
    }
    console.log('Fetched these contract properties', contractProperties);
    this.existingContractProperties$.set(contractProperties);
  }

  // This makes the provider and addresses available to the application
  private async configureProviderAndAddresses() {
    
    const metamaskProvider = await detectEthereumProvider()
      .catch(error => {
        console.log('Error fetching metamask provider'); 
        throw error;
      });
    
    this.monitorProviderChanges(metamaskProvider);
    this.currentProvider$.set(new ethers.providers.Web3Provider((metamaskProvider as any)));
    
    const currentAccounts = await (this.currentProvider$()!.send('eth_requestAccounts', []) as Promise<string[]>)
      .catch(error => {
        console.log('Error fetching provider accounts'); 
        throw error;
      }); // This triggers a request to connect a wallet
    
    this.connectedAddress$.set(currentAccounts[0]); // Update the accounts
    console.log('Initial connected address is: ', this.connectedAddress$());
  }

  // Initialize the listener for changes to the provider account. Not sure why this only works with metmask provider vs ethers provider
  private monitorProviderChanges(metamaskProvider: any) {
    metamaskProvider?.on('accountsChanged', (accounts: string[]) => {
      // Running this inside of ngZone because otherwise the change detection isn't triggered on observable update
      this.ngZone.run(() => {
        this.connectedAddress$.set(accounts[0]); // Update the accounts
        console.log('New connected address is:', this.connectedAddress$());
      })
    })

  };

  private monitorEscrowApproval(contract: ethers.Contract) {
    contract.on('Approved', async (balance: number) => {
      this.ngZone.run(() => {
        console.log('Contract emitted the Approved event!', balance);
        this.approveEscrowProcessing$.set(false);
      });
      await this.fetchContractProperties(contract.address);
      const updatedContract: Partial<ContractProperties> = {
        address: contract.address,
        approved: this.existingContractProperties$()?.approved,
        value: this.existingContractProperties$()?.value
      }
      this.firebaseService.updateDeployedContract(updatedContract);
    });
  }

  private extractEvmErrorMessageText(errorMessage: string): string {
    if (!errorMessage) {
      return 'Transaction reverted with no message.';
    }
    const regex = new RegExp(/reason="(.*?)"/g);
    const match = regex.exec(errorMessage);
    if (match) {
      return match[1];
    } else {
      return errorMessage;
    }
  }
  
}

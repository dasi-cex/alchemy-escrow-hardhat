import { Injectable, NgZone, signal } from '@angular/core';
import detectEthereumProvider from '@metamask/detect-provider'
import { ethers } from 'ethers';
import { Observable, Subject, catchError, from, shareReplay, switchMap, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HardhatService {

  currentProvider$: Subject<ethers.providers.Web3Provider> = new Subject();
  connectedAddress$ = signal<string>('');

  constructor(
    private ngZone: NgZone
  ) { 
    this.configureProviderAndAddresses();
  }
  
  // This makes the provider and addresses available to the application
  private configureProviderAndAddresses() {
    from(detectEthereumProvider())
      .pipe(
        switchMap(metamaskProvider => {
          const ethersProvider = new ethers.providers.Web3Provider((metamaskProvider as any));
          this.monitorProviderChanges(metamaskProvider, ethersProvider);
          this.initializeProvider(ethersProvider);
          return this.requestProviderAccounts(ethersProvider);
        }),
        tap(accounts => {
          this.initializeCurrentAccount(accounts);
        }),
        shareReplay(),
        catchError( error => {
          console.log('Error fetching provider info', error);
          return throwError(() => new Error(error));
        })
        
      ).subscribe();
  }

  // Initialize the listener for changes to the provider account
  private monitorProviderChanges(metamaskProvider: any, ethersProvider: ethers.providers.Web3Provider) {
    metamaskProvider?.on('accountsChanged', (accounts: string[]) => {
      this.currentProvider$.next(ethersProvider); // Update the provider
      // Running this inside of ngZone because otherwise the change detection isn't triggered on observable update
      this.ngZone.run(() => {
        this.connectedAddress$.set(accounts[0]); // Update the accounts
        console.log('New connected address is:', this.connectedAddress$());
      })
    })
  };

  // Set the initial state of the provider
  private initializeProvider(ethersProvider: ethers.providers.Web3Provider) {
    this.currentProvider$.next(ethersProvider);
  }

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

}

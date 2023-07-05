# EscrowHardhat

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.1.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Local Hardhat Server

Run `npx hardhat node` to start a test blockchain on `http://localhost:8545`.

## Compiling the Solidity Contract

Run `npx hardhat compile`. You may need to go into the root directory tsconfig.json `"compilierOptions"` and swap out `"module": "ES2022"` with `"module: "commonjs"`, which you'll see is currently commented out.

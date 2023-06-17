import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: 'localhost',
  paths: {
    artifacts: "./src/app/artifacts",
  }
};

export default config;

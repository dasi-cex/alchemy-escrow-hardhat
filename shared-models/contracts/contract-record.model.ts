
import { Timestamp } from "@google-cloud/firestore";
import { ContractProperties } from "./contract-properties.model";

export interface ContractRecord extends ContractProperties {
  createdAt: Timestamp
  lastUpdatedAt: Timestamp
}
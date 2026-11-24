import { StoreContact, VaultStoreConfig } from "./types";
import { getVaultStoreConfig, saveVaultStoreConfig } from "./cloud-vault";

export type { StoreContact };
export type StoreAdminData = VaultStoreConfig;

export async function getStoreDataAsync(): Promise<VaultStoreConfig> {
  return getVaultStoreConfig();
}

export async function saveStoreDataAsync(patch: Partial<VaultStoreConfig>): Promise<VaultStoreConfig> {
  return saveVaultStoreConfig(patch);
}

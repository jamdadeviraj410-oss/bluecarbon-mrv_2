# Real Polygon Blockchain Setup

The repository now contains the complete code path for real MRV anchoring. One external step cannot be performed safely by source control: deploying the contract and supplying a wallet/RPC secret.

## Architecture

`Verified MRV -> canonical JSON -> SHA-256 -> Polygon Amoy BlueCarbonMRVAnchor -> tx hash -> Supabase -> public verification`

Evidence files stay in Supabase Storage. Only a deterministic hash and minimal metadata are placed on-chain.

## 1. Apply database migrations

Apply migrations in `supabase/migrations/` in filename order, including:

- `202608240011_blockchain_mrv_anchors.sql`
- `202608240012_activate_polygon_amoy.sql`

Do this with the Supabase CLI or the SQL editor. Do not manually edit production tables to match the UI.

## 2. Deploy the contract

Deploy `contracts/BlueCarbonMRVAnchor.sol` to Polygon Amoy (chain ID 80002) using Remix or your preferred Solidity deployment tool.

The deploying wallet becomes the contract owner. Use a dedicated hackathon wallet, not a personal wallet holding funds.

Save the deployed contract address.

## 3. Register the deployed contract in Supabase

Insert/update a `smart_contracts` row using the real Amoy address and the existing Amoy `blockchain_networks.id`. Set `is_active=true`.

Do not reuse the two placeholder addresses from the old seed migration; migration 12 disables them.

## 4. Configure Edge Function secrets

Set these with Supabase secrets:

```bash
supabase secrets set POLYGON_RPC_URL="https://rpc-amoy.polygon.technology"
supabase secrets set POLYGON_PRIVATE_KEY="<DEDICATED_RELAYER_PRIVATE_KEY>"
supabase secrets set MRV_ANCHOR_CONTRACT_ADDRESS="<DEPLOYED_CONTRACT_ADDRESS>"
supabase secrets set MRV_BLOCKCHAIN_NETWORK_ID="<AMOY_NETWORK_UUID>"
supabase secrets set MRV_SMART_CONTRACT_ID="<REAL_SMART_CONTRACT_UUID>"
```

Never put `POLYGON_PRIVATE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in Vite environment variables.

## 5. Deploy functions

```bash
supabase functions deploy anchor-mrv
supabase functions deploy verify-mrv
```

## 6. Test the full flow

1. Log in.
2. Create/choose an MRV submission.
3. Upload evidence and ensure its SHA-256 is stored.
4. Complete verification and set the submission status to `VERIFIED`.
5. Open `/mrv/blockchain/<submission UUID>`.
6. Click **Anchor on Polygon**.
7. Wait for confirmation.
8. Click **Verify On-Chain**.
9. Open the Polygon Amoy explorer transaction link.

Expected result: the on-chain record ID equals the MRV submission code and the SHA-256 hash matches the recomputed canonical record.

## What is intentionally not automatic

The repo cannot safely invent or commit a real wallet private key, RPC provider API key, or a contract address that has not been deployed. Those three values must be supplied through your own Polygon/Supabase accounts.

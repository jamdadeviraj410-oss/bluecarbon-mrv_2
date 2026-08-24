# anchor-mrv Edge Function

This function is the only server-side component allowed to sign Polygon transactions.

## Required Supabase secrets

Set these in the Supabase project, never in Vite/browser `.env` files:

- `POLYGON_RPC_URL` — Polygon Amoy RPC URL
- `POLYGON_PRIVATE_KEY` — dedicated deployer/relayer wallet private key
- `MRV_ANCHOR_CONTRACT_ADDRESS` — deployed `BlueCarbonMRVAnchor` address
- `MRV_BLOCKCHAIN_NETWORK_ID` — UUID of the active `blockchain_networks` row
- `MRV_SMART_CONTRACT_ID` — UUID of the deployed contract row (optional; omit if not seeded yet)

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to the function runtime.

## Deploy

From the repository root:

```bash
supabase functions deploy anchor-mrv
```

The browser calls this function through `supabase.functions.invoke('anchor-mrv', ...)`.

The function rejects non-VERIFIED MRV submissions, builds a deterministic canonical payload, computes SHA-256, sends `anchorMRV(...)` to Polygon, and persists the transaction hash/block/data hash in Supabase.

## Security

Use a dedicated low-balance relayer wallet. Never expose its private key, seed phrase, or service-role key to React/Vite. The contract owner should be the same relayer wallet (or ownership should be transferred to it after deployment).

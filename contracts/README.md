# BlueCarbon MRV Anchor Contract

`BlueCarbonMRVAnchor.sol` is deliberately small: it records only a SHA-256 MRV data hash, submission code, timestamp, block number, and verified carbon amount. Evidence files and PII remain off-chain in Supabase.

## Deployment

Deploy `BlueCarbonMRVAnchor.sol` to **Polygon Amoy (chain ID 80002)** for the hackathon demo. Do not use the placeholder contract addresses that existed in earlier seed data; those were demo UI values, not deployments.

After deployment:

1. Record the deployed address.
2. Set `MRV_ANCHOR_CONTRACT_ADDRESS` in Supabase Edge Function secrets.
3. Transfer contract ownership to the same dedicated relayer wallet used by `anchor-mrv`, if a different deployer wallet was used.
4. Insert the deployed contract address into `smart_contracts` and connect it to the Amoy `blockchain_networks` row.
5. Set `MRV_BLOCKCHAIN_NETWORK_ID` to the Amoy network row UUID.
6. Set `MRV_SMART_CONTRACT_ID` to the corresponding `smart_contracts.id`.

The contract intentionally has no user-facing mint/transfer function. It is an integrity anchor, not a cryptocurrency.

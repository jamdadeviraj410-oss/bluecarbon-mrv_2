-- Migration 12: make Polygon Amoy the demo write network.
-- Earlier seed data contains placeholder contract addresses used only for UI demos.

ALTER TABLE public.smart_contracts
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

UPDATE public.smart_contracts
SET is_active = false
WHERE contract_address IN (
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  '0x498b3b7238a264a696fa2c65089f2d1e028b12f4'
);

UPDATE public.blockchain_networks
SET is_active = false
WHERE chain_id IN (137, 1);

UPDATE public.blockchain_networks
SET is_active = true,
    network_type = 'TESTNET',
    rpc_endpoint = 'https://rpc-amoy.polygon.technology',
    explorer_url = 'https://amoy.polygonscan.com'
WHERE chain_id = 80002;

COMMENT ON TABLE public.smart_contracts IS
  'Only contracts with is_active=true and a real deployed address are used for blockchain writes.';

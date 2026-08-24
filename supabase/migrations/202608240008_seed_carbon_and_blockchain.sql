-- Migration 8: Seed Blockchain Networks, Smart Contracts, Carbon Credits & Transactions

-- Blockchain Networks
INSERT INTO public.blockchain_networks (id, name, chain_id, network_type, rpc_endpoint, explorer_url, is_active)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Polygon Mainnet', 137, 'MAINNET', 'https://polygon-rpc.com', 'https://polygonscan.com', true),
    ('e0000000-0000-0000-0000-000000000002', 'Ethereum Mainnet', 1, 'MAINNET', 'https://eth.llamarpc.com', 'https://etherscan.io', true),
    ('e0000000-0000-0000-0000-000000000003', 'Polygon Amoy Testnet', 80002, 'TESTNET', 'https://rpc-amoy.polygon.technology', 'https://amoy.polygonscan.com', true)
ON CONFLICT (name) DO NOTHING;

-- Smart Contracts
INSERT INTO public.smart_contracts (id, network_id, contract_name, contract_address, token_standard)
VALUES
    ('f3000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'BlueCarbonMRV_ERC1155', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', 'ERC1155'),
    ('f3000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'NCCR_Registry_Anchor', '0x498b3b7238a264a696fa2c65089f2d1e028b12f4', 'ERC721')
ON CONFLICT (contract_address) DO NOTHING;

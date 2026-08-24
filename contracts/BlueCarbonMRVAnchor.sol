// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BlueCarbon MRV Anchor
/// @notice Stores tamper-evident hashes of verified MRV records on-chain.
/// @dev This contract intentionally stores only hashes and small metadata, not evidence files or PII.
contract BlueCarbonMRVAnchor {
    address public owner;

    struct Anchor {
        uint64 timestamp;
        uint64 blockNumber;
        uint256 carbonAmountCentiTonne;
        string recordId;
        bool exists;
    }

    mapping(bytes32 => Anchor) private anchors;

    event MRVAnchored(
        bytes32 indexed dataHash,
        string recordId,
        uint256 carbonAmountCentiTonne,
        uint256 timestamp,
        uint256 blockNumber
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "NOT_OWNER");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ZERO_ADDRESS");
        owner = newOwner;
    }

    function anchorMRV(
        bytes32 dataHash,
        string calldata recordId,
        uint256 carbonAmountCentiTonne
    ) external onlyOwner returns (bool) {
        require(dataHash != bytes32(0), "EMPTY_HASH");
        require(!anchors[dataHash].exists, "ALREADY_ANCHORED");

        anchors[dataHash] = Anchor({
            timestamp: uint64(block.timestamp),
            blockNumber: uint64(block.number),
            carbonAmountCentiTonne: carbonAmountCentiTonne,
            recordId: recordId,
            exists: true
        });

        emit MRVAnchored(
            dataHash,
            recordId,
            carbonAmountCentiTonne,
            block.timestamp,
            block.number
        );

        return true;
    }

    function getAnchor(bytes32 dataHash)
        external
        view
        returns (
            uint64 timestamp,
            uint64 blockNumber,
            uint256 carbonAmountCentiTonne,
            string memory recordId,
            bool exists
        )
    {
        Anchor memory a = anchors[dataHash];
        return (a.timestamp, a.blockNumber, a.carbonAmountCentiTonne, a.recordId, a.exists);
    }

    /// @notice Verifies whether an MRV hash is anchored and returns its record details
    /// @param dataHash SHA-256 hash of the canonical MRV record
    function verifyMRV(bytes32 dataHash)
        external
        view
        returns (
            bool exists,
            string memory recordId,
            uint256 carbonAmountCentiTonne,
            uint64 timestamp,
            uint64 blockNumber
        )
    {
        Anchor memory a = anchors[dataHash];
        return (a.exists, a.recordId, a.carbonAmountCentiTonne, a.timestamp, a.blockNumber);
    }

    function isAnchored(bytes32 dataHash) external view returns (bool) {
        return anchors[dataHash].exists;
    }
}

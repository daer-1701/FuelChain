// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FuelChain
 * @notice Tamper-evident audit layer for FuelChain Bolivia (hackathon DEMO).
 * @dev Stores only batchId, eventKind, dataHash, actor, timestamp — never PDFs or PII.
 */
contract FuelChain {
    struct Anchor {
        bytes32 batchId;
        string eventKind;
        bytes32 dataHash;
        address actor;
        uint256 timestamp;
    }

    event BatchCreated(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event AuthorizationReferenced(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event CustodyEventRegistered(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event DocumentHashRegistered(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event SampleRegistered(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event LabResultRegistered(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event QualityCertified(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event MeasurementAnchored(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event AnomalyRegistered(bytes32 indexed batchId, address indexed actor, bytes32 dataHash, uint256 timestamp);
    event EvidenceAnchored(
        bytes32 indexed batchId,
        string eventKind,
        bytes32 dataHash,
        address indexed actor,
        uint256 timestamp,
        uint256 indexed anchorIndex
    );

    Anchor[] public anchors;
    mapping(bytes32 => uint256[]) public batchAnchorIndexes;

    function anchorEvidence(
        bytes32 batchId,
        string calldata eventKind,
        bytes32 dataHash
    ) external returns (uint256 index) {
        require(batchId != bytes32(0), "batchId required");
        require(dataHash != bytes32(0), "dataHash required");

        index = anchors.length;
        anchors.push(
            Anchor({
                batchId: batchId,
                eventKind: eventKind,
                dataHash: dataHash,
                actor: msg.sender,
                timestamp: block.timestamp
            })
        );
        batchAnchorIndexes[batchId].push(index);

        emit EvidenceAnchored(batchId, eventKind, dataHash, msg.sender, block.timestamp, index);
        _emitTyped(batchId, eventKind, dataHash);
    }

    function getAnchor(uint256 index) external view returns (Anchor memory) {
        require(index < anchors.length, "index OOB");
        return anchors[index];
    }

    function getAnchorCount() external view returns (uint256) {
        return anchors.length;
    }

    function getBatchAnchorIndexes(bytes32 batchId) external view returns (uint256[] memory) {
        return batchAnchorIndexes[batchId];
    }

    function _emitTyped(bytes32 batchId, string calldata eventKind, bytes32 dataHash) internal {
        bytes32 kind = keccak256(bytes(eventKind));
        if (kind == keccak256("BatchCreated")) {
            emit BatchCreated(batchId, msg.sender, dataHash, block.timestamp);
        } else if (kind == keccak256("AuthorizationReferenced")) {
            emit AuthorizationReferenced(batchId, msg.sender, dataHash, block.timestamp);
        } else if (kind == keccak256("CustodyEventRegistered")) {
            emit CustodyEventRegistered(batchId, msg.sender, dataHash, block.timestamp);
        } else if (kind == keccak256("DocumentHashRegistered")) {
            emit DocumentHashRegistered(batchId, msg.sender, dataHash, block.timestamp);
        } else if (kind == keccak256("SampleRegistered")) {
            emit SampleRegistered(batchId, msg.sender, dataHash, block.timestamp);
        } else if (kind == keccak256("LabResultRegistered")) {
            emit LabResultRegistered(batchId, msg.sender, dataHash, block.timestamp);
        } else if (kind == keccak256("QualityCertified")) {
            emit QualityCertified(batchId, msg.sender, dataHash, block.timestamp);
        } else if (kind == keccak256("MeasurementAnchored")) {
            emit MeasurementAnchored(batchId, msg.sender, dataHash, block.timestamp);
        } else if (kind == keccak256("AnomalyRegistered")) {
            emit AnomalyRegistered(batchId, msg.sender, dataHash, block.timestamp);
        }
    }
}

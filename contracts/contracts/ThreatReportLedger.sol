// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ThreatReportLedger {
    struct ReportRecord {
        uint256 id;
        string organizationName;
        string attackType;
        bytes32 reportHash;
        bytes32 sensitiveDataHash;
        uint256 timestamp;
        address submitter;
        uint256 totalRecordsEvaluated;
    }

    ReportRecord[] private reports;
    event ReportAnchored(uint256 indexed id, string organizationName, string attackType, bytes32 reportHash, address indexed submitter);

    function anchorReport(
        string calldata organizationName,
        string calldata attackType,
        bytes32 reportHash,
        bytes32 sensitiveDataHash,
        uint256 totalRecordsEvaluated
    ) external returns (uint256 id) {
        id = reports.length;
        reports.push(ReportRecord(id, organizationName, attackType, reportHash, sensitiveDataHash, block.timestamp, msg.sender, totalRecordsEvaluated));
        emit ReportAnchored(id, organizationName, attackType, reportHash, msg.sender);
    }

    function getAllReports() external view returns (ReportRecord[] memory) {
        return reports;
    }
}

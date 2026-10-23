// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CTIToken (Cyber Threat Intelligence Incentive Token - CTIX)
 * @dev ERC-20 compliant utility & reward token for decentralized threat intelligence sharing.
 * Fulfills Section 1.2 & 3.1: "Incentive Management: Automatically distribute token rewards
 * to participants based on data quality to prevent freeloading."
 */
contract CTIToken {
    string public name = "Cyber Threat Intelligence Token";
    string public symbol = "CTIX";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    address public owner;
    address public ledgerContract;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => uint256) public totalEarnedRewards;
    mapping(address => uint256) public reportsContributed;

    struct RewardLog {
        uint256 id;
        address recipient;
        uint256 amount;
        string reportHash;
        uint256 timestamp;
    }

    RewardLog[] public rewardHistory;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event RewardIssued(address indexed recipient, uint256 amount, string reportHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only consortium admin can call");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Mint initial supply of 1,000,000 CTIX to consortium reserve
        _mint(msg.sender, 1000000 * 10**uint256(decimals));
    }

    function setLedgerContract(address _ledger) external onlyOwner {
        ledgerContract = _ledger;
    }

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient CTIX balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "Insufficient CTIX balance");
        require(allowance[from][msg.sender] >= value, "Allowance exceeded");
        balanceOf[from] -= value;
        allowance[from][msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);
        return true;
    }

    /**
     * @notice Distributes incentive rewards to organizations upon admin approval of threat evidence.
     * @param recipient Contributor organization wallet
     * @param amount Amount of CTIX tokens (default 25 CTIX)
     * @param reportHash The SHA-256 fingerprint of the verified incident
     */
    function rewardContributor(address recipient, uint256 amount, string calldata reportHash) external returns (bool) {
        require(msg.sender == owner || msg.sender == ledgerContract, "Unauthorized reward issuer");
        _mint(recipient, amount);
        totalEarnedRewards[recipient] += amount;
        reportsContributed[recipient] += 1;

        rewardHistory.push(RewardLog({
            id: rewardHistory.length + 1,
            recipient: recipient,
            amount: amount,
            reportHash: reportHash,
            timestamp: block.timestamp
        }));

        emit RewardIssued(recipient, amount, reportHash, block.timestamp);
        return true;
    }

    function getRewardHistoryLength() external view returns (uint256) {
        return rewardHistory.length;
    }
}

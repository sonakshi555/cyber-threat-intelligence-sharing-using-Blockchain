const hre = require('hardhat');

async function main() {
  const Ledger = await hre.ethers.getContractFactory('ThreatReportLedger');
  const ledger = await Ledger.deploy();
  await ledger.waitForDeployment();
  console.log(`ThreatReportLedger deployed to: ${await ledger.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

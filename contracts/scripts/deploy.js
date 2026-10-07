const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

function updateBackendContractAddress(address) {
  const backendEnvPath = path.resolve(__dirname, '../../backend/.env');
  if (!fs.existsSync(backendEnvPath)) {
    console.log(`Backend environment file not found; set CONTRACT_ADDRESS=${address} in backend/.env`);
    return;
  }

  const contents = fs.readFileSync(backendEnvPath, 'utf8');
  const updated = /^CONTRACT_ADDRESS=.*$/m.test(contents)
    ? contents.replace(/^CONTRACT_ADDRESS=.*$/m, `CONTRACT_ADDRESS=${address}`)
    : `${contents.trimEnd()}\nCONTRACT_ADDRESS=${address}\n`;
  fs.writeFileSync(backendEnvPath, updated);
  console.log(`Updated backend/.env with CONTRACT_ADDRESS=${address}`);
}

async function main() {
  const Ledger = await hre.ethers.getContractFactory('ThreatReportLedger');
  const ledger = await Ledger.deploy();
  await ledger.waitForDeployment();
  const address = await ledger.getAddress();
  console.log(`ThreatReportLedger deployed to: ${address}`);
  updateBackendContractAddress(address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

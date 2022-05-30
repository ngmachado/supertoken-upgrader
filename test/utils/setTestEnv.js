const deployFramework = require("@superfluid-finance/ethereum-contracts/scripts/deploy-framework");
const deployTestToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-test-token");
const deploySuperToken = require("@superfluid-finance/ethereum-contracts/scripts/deploy-super-token");
const TokenABI =
  require("@superfluid-finance/ethereum-contracts/build/contracts/TestToken.json").abi;
const GovernanceABI =
  require("@superfluid-finance/ethereum-contracts/build/contracts/TestGovernance.json").abi;
const ISuperfluid =
  require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperfluid").abi;
const ISuperTokenFactory =
  require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperTokenFactory").abi;
const ISuperToken =
  require("@superfluid-finance/ethereum-contracts/build/contracts/ISuperToken").abi;
const { ethers, web3 } = require("hardhat");
const { Framework } = require("@superfluid-finance/sdk-core");

const provider = web3;

const errorHandler = (err) => {
  if (err) throw err;
};

const deployTestEnv = async () => {
  const accounts = await ethers.getSigners();
  // deploy the framework
  await deployFramework(errorHandler, {
    web3,
    from: accounts[0].address,
  });
  await deployTestToken(errorHandler, [":", "fDAI"], {
    web3,
    from: accounts[0].address,
  });
  await deploySuperToken(errorHandler, [":", "fDAI"], {
    web3,
    from: accounts[0].address,
  });

  const sf = await Framework.create({
    networkName: "custom",
    provider,
    dataMode: "WEB3_ONLY",
    resolverAddress: process.env.RESOLVER_ADDRESS,
    protocolReleaseVersion: "test",
  });

  const signer = await sf.createSigner({
    signer: accounts[0],
    provider: provider,
  });
  const daix = await sf.loadSuperToken("fDAIx");
  const daiAddress = daix.underlyingToken.address;
  const dai = new ethers.Contract(daiAddress, TokenABI, accounts[0]);



  const host = new ethers.Contract(
    sf.settings.config.hostAddress,
    ISuperfluid,
    accounts[0]
  );

  const superTokenFactoryAddress = await host.getSuperTokenFactory();
  const factory = new ethers.Contract(superTokenFactoryAddress, ISuperTokenFactory, accounts[0]);
  //create mock ERC20 to test decimals
  const mockERC20Factory = await ethers.getContractFactory("MockERC20", accounts[0]);
  mock20 = await mockERC20Factory.deploy("mock", "mk", 6);
  const tx = await factory.connect(accounts[0]).functions["createERC20Wrapper(address,uint8,string,string)"](
            mock20.address,
            0,
            "mockx",
            "mkx");

  const decodeTx = await tx.wait();
  const superTokenAddr = decodeTx.events.find((e) => e.event === "SuperTokenCreated").args[0];

  console.log(superTokenAddr);


  superMock20 = new ethers.Contract(
    superTokenAddr,
    ISuperToken,
    accounts[0]
  );


  const governanceAddress = await host.getGovernance();
  const superfluid = new ethers.Contract(
    governanceAddress,
    GovernanceABI,
    accounts[0]
  );
  const upgraderFactory = await ethers.getContractFactory(
    "Upgrader",
    accounts[0]
  );
  return {
    defaultDeployer: signer,
    accounts: accounts,
    sf: sf,
    superfluid: superfluid,
    host: host,
    tokens: {
      dai: dai,
      daix: daix,
      mockToken: mock20,
      mockSuperToken: superMock20
    },
    factories: {
      upgrader: upgraderFactory,
    },
  }
};



module.exports = {
  deployTestEnv,
}

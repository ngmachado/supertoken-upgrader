require("dotenv").config();

require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-ethers");
require('hardhat-deploy');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.13",
  networks: {
    rinkeby: {
      url: process.env.RINKEBY_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    kovan: {
      url: process.env.KOVAN_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    polygon: {
      url: process.env.POLYGON_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    arbitrum : {
      url: process.env.ARBITRUM_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    optimism : {
      url: process.env.OPTIMISM_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    avalanche : {
      url: process.env.AVALANCHE_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    gnosis : {
      url: process.env.GNOSIS_URL || "",
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },

  },
  namedAccounts: {
    deployer: {
      default: 0,
      3: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
      4: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
      5: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
      42: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
      42160: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
      43114: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
      100: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
      10: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
      137: "0xa67E5e25DBEa60E843dDe146f4518f69e23bbe78",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  mocha: {
    timeout: 4000000
  }
};

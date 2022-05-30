const { ethers, network } = require("hardhat");
const BN = require("bn.js");

const expectedRevert = async (
  fn,
  revertMsg,
  printError = false,
  nestedError = false
) => {
  try {
    await fn;
    return false;
  } catch (err) {
    if (printError) console.log(err);
    if (nestedError) {
      return err.errorObject.errorObject.error.toString().includes(revertMsg);
    }
    return err.toString().includes(revertMsg);
  }
};

const deployNewUpgrader = async (
  env,
  upgraders,
  owner = env.defaultDeployer.address,
) => {
  return await env.factories.upgrader.deploy(owner, upgraders);
};

const deployNewUpgraderWithSupportTokens = async (
    env,
    upgraders,
    superTokens,
    owner = env.defaultDeployer,
) => {
  const contract = await env.factories.upgrader.deploy(owner.address, upgraders);
  for(let supertoken in superTokens) {
    console.log("adding supertoken: ", supertoken);

  }
};

const mint = async (env, account, amount = "1000") => {
  await env.tokens.dai.mint(
    account.address,
    ethers.utils.parseUnits(amount, 18)
  );
};

const mockMint = async (env, account, amount = "1000") => {
  await env.tokens.mockToken.mint(
    account.address,
    ethers.utils.parseUnits(amount, 18)
  );
};

const mintAndUpgrade = async (env, account, amount = "1000") => {
  await env.tokens.dai.mint(
      account.address,
      ethers.utils.parseUnits(amount, 18)
  );
  await env.tokens.dai
      .connect(account)
      .approve(env.tokens.daix.address, ethers.utils.parseEther(amount));
  const daixUpgradeOperation = env.tokens.daix.upgrade({
    amount: ethers.utils.parseEther(amount),
  });
  await daixUpgradeOperation.exec(account);
};

const daiApprove = async (env, account, spender, amount = "1000") => {
  return await env.tokens.dai
      .connect(account)
      .approve(spender, ethers.utils.parseEther(amount));
};

const mockApprove = async (env, account, spender, amount = "1000") => {
  return await env.tokens.mockToken
    .connect(account)
    .approve(spender, ethers.utils.parseEther(amount));
};

const daixApprove = async (env, account, spender, amount = "1000") => {
  const daixApproveOperation = env.tokens.daix.approve({receiver: spender, amount: ethers.utils.parseEther(amount)});
  return await daixApproveOperation.exec(account);
};

const superMockApprove = async (env, account, spender, amount = "1000") => {
  const daixApproveOperation = env.tokens.mockSuperToken.approve({receiver: spender, amount: ethers.utils.parseEther(amount)});
  return await daixApproveOperation.exec(account);
};

const daixAllowance = async (env,account, spender) => {
  return await env.tokens.daix.allowance({owner: account.address, spender, providerOrSigner: account});
}

const superMockAllowance = async (env,account, spender) => {
  return await env.tokens.mockSuperToken.allowance({owner: account.address, spender, providerOrSigner: account});
}

const daixBalanceOf = async (env, account) => {
  return await env.tokens.daix.balanceOf({
    account:account,
    providerOrSigner: env.accounts[0],
  });
}

const superMockBalanceOf = async (env, account) => {
  return await env.tokens.mockSuperToken.connect(env.accounts[0]).balanceOf(
    account
  );
}

const daiBalanceOf = async (env, account) => {
  return await env.tokens.dai.balanceOf(account);
}

const toBN = (a) => {
  return new BN(a);
}

const scaleDecimalTo18 = (amount, tokenDecimals, targetDecimals) => {
  if(tokenDecimals > targetDecimals) {
    return amount / 10 ** (tokenDecimals - targetDecimals);
  }
  return amount * 10 ** (targetDecimals - tokenDecimals);
}

module.exports = {
  expectedRevert,
  mint,
  mockMint,
  mintAndUpgrade,
  daiApprove,
  daixApprove,
  mockApprove,
  daixAllowance,
  deployNewUpgrader,
  toBN,
  daiBalanceOf,
  daixBalanceOf,
  superMockBalanceOf,
  scaleDecimalTo18,
};

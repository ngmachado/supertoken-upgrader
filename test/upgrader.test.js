const { assert } = require("chai");
const { deployTestEnv } = require("./utils/setTestEnv");
const f = require("./utils/helperFuncs");
const {ethers} = require("hardhat");

let env;

beforeEach(async function () {
  env = await deployTestEnv();
  await f.mint(env, env.accounts[0]);
  await f.mint(env, env.accounts[1]);
  await f.mint(env, env.accounts[2]);
  await f.mint(env, env.accounts[3]);
});

describe("Upgrader - Deployments", function () {
  it("#1.1 - should deploy with owner & upgraders", async () => {
    await f.deployNewUpgrader(env, [env.accounts[5].address, env.accounts[6].address]);
  });
  //test reverts
});

describe("Upgrader - Upgrade Operations", function () {
  it("#2.1 - upgrade balance to same user", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address]);
    // approves user balance to upgrade contract
    await f.daiApprove(env, env.accounts[0], upgrader.address);
    const initialBal = await env.tokens.daix.balanceOf({
      account: env.accounts[0].address,
      providerOrSigner: env.accounts[0],
    });

    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.daix.address);
    // make upgrade to same account
    await upgrader.connect(env.accounts[0]).upgrade(env.tokens.daix.address, env.accounts[0].address, ethers.utils.parseEther("1000"));

    const finalBal = await env.tokens.daix.balanceOf({
      account: env.accounts[0].address,
      providerOrSigner: env.accounts[0],
    });
    assert.equal(
        initialBal.toString(),
        "0",
        "account starting with supertokens"
    );
    assert.equal(
        finalBal.toString(),
        ethers.utils.parseEther("1000"),
        "account should get upgrade result"
    );

  });
  it("#2.1.1 - upgrade balance to other user (upgrader)", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address]);
    // approves user balance to upgrade contract
    await f.daiApprove(env, env.accounts[3], upgrader.address);
    const initialBal = await env.tokens.daix.balanceOf({
      account: env.accounts[3].address,
      providerOrSigner: env.accounts[0],
    });

    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.daix.address);
    // make upgrade to same account
    await upgrader.connect(env.accounts[5]).upgrade(env.tokens.daix.address, env.accounts[3].address, ethers.utils.parseEther("1000"));

    const finalBal = await env.tokens.daix.balanceOf({
      account: env.accounts[3].address,
      providerOrSigner: env.accounts[0],
    });
    assert.equal(
      initialBal.toString(),
      "0",
      "account starting with supertokens"
    );
    assert.equal(
      finalBal.toString(),
      ethers.utils.parseEther("1000"),
      "account should get upgrade result"
    );

  });
  it("#2.2 - upgrade balance to same user (diff underlying decimals)", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address], env.accounts[0].address);
    await f.mockMint(env, env.accounts[0]);
    // approves user balance to upgrade contract
    await f.mockApprove(env, env.accounts[0], upgrader.address);
    const initialBal = await f.superMockBalanceOf(env, env.accounts[0].address);

    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.mockSuperToken.address);
    // make upgrade to same account
    await upgrader.connect(env.accounts[5]).upgrade(env.tokens.mockSuperToken.address, env.accounts[0].address, "1");
    const finalBal = await f.superMockBalanceOf(env, env.accounts[0].address);
        assert.equal(
          initialBal.toString(),
          "0",
          "account starting with supertokens"
        );
        assert.equal(
          finalBal.toString(),
          f.scaleDecimalTo18(1, 6, 18),
          "account should get upgrade result"
        );
  });
  it("#2.3 - should revert if no allowance", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address], env.accounts[0].address);
    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.daix.address);
    // make upgrade to same account
    const rightError = await f.expectedRevert(
        upgrader.connect(env.accounts[5]).upgrade(env.tokens.daix.address, env.accounts[0].address, ethers.utils.parseEther("1000")),
        "ERC20: insufficient allowance"
    );
    assert.ok(rightError);

  });
  it("#2.4 - should revert if lower allowance", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address], env.accounts[0].address);
    await f.daiApprove(env, env.accounts[0], upgrader.address, "999");
    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.daix.address);
    // make upgrade to same account
    const rightError = await f.expectedRevert(
        upgrader.connect(env.accounts[5]).upgrade(env.tokens.daix.address, env.accounts[0].address, ethers.utils.parseEther("1000")),
        "ERC20: insufficient allowance"
    );
    assert.ok(rightError);
  });
  it("#2.5 - should revert if token not whitelisted", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address], env.accounts[0].address);
    await f.daiApprove(env, env.accounts[0], upgrader.address, "1000");
    // make upgrade to same account
    const rightError = await f.expectedRevert(
        upgrader.connect(env.accounts[5]).upgrade(env.tokens.daix.address, env.accounts[0].address, ethers.utils.parseEther("1000")),
        "SuperTokenNotSupported()",
    );
    assert.ok(rightError);
  });
  it("#2.6 - should revert if token removed from whitelisted", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address], env.accounts[0].address);
    await f.daiApprove(env, env.accounts[0], upgrader.address, "1000");
    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.daix.address);
    // remove supertoken from whitelist
    await upgrader.connect(env.accounts[0]).removeSuperToken(env.tokens.daix.address);
    // make upgrade to same account
    const rightError = await f.expectedRevert(
        upgrader.connect(env.accounts[5]).upgrade(env.tokens.daix.address, env.accounts[0].address, ethers.utils.parseEther("1000")),
        "SuperTokenNotSupported()",
    );
    assert.ok(rightError);
  });
  it("#2.7 - should revert if not upgrader or msg.sender", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address]);
    await f.daiApprove(env, env.accounts[0], upgrader.address, "1000");
    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.daix.address);
    // make upgrade to same account
    const rightError = await f.expectedRevert(
      upgrader.connect(env.accounts[6]).upgrade(env.tokens.daix.address, env.accounts[0].address, ethers.utils.parseEther("1000")),
      "OperationNotAllowed()",
    );
    assert.ok(rightError);
  });
});

describe("Upgrader - Downgrade Operations", function () {
  it("#3.1 - downgrade balance to same user", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address], env.accounts[0].address);
    await f.mintAndUpgrade(env, env.accounts[4]);
    await f.daixApprove(env, env.accounts[4], upgrader.address);
    const initialBal = await f.daiBalanceOf(env, env.accounts[4].address)
    const initialBalx = await f.daixBalanceOf(env, env.accounts[4].address)

    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.daix.address);
    // make upgrade to same account
    await upgrader.connect(env.accounts[4]).downgrade(env.tokens.daix.address, env.accounts[4].address, ethers.utils.parseEther("1000"));
    const finalBal = await f.daiBalanceOf(env, env.accounts[4].address)
    const finalBalx = await f.daixBalanceOf(env, env.accounts[4].address)

    assert.equal(
        initialBalx.toString(),
        ethers.utils.parseEther("1000"),
        "account starting no supertokens"
    );
    assert.equal(
        initialBal.toString(),
        "0",
        "account starting with dai"
    );

    assert.equal(
        finalBalx.toString(),
        "0",
        "account ending with supertokens"
    );
    assert.equal(
        finalBal.toString(),
        ethers.utils.parseEther("1000"),
        "account end with dai"
    );
  });
  it("#3.1.1 - downgrade balance to other user (upgrader)", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address]);
    await f.mintAndUpgrade(env, env.accounts[7]);
    await f.daixApprove(env, env.accounts[7], upgrader.address);
    const initialBal = await f.daiBalanceOf(env, env.accounts[7].address);
    const initialBalx = await f.daixBalanceOf(env, env.accounts[7].address);

    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.daix.address);
    // make upgrade to same account
    await upgrader.connect(env.accounts[5]).downgrade(env.tokens.daix.address, env.accounts[7].address, ethers.utils.parseEther("1000"));
    const finalBal = await f.daiBalanceOf(env, env.accounts[7].address);
    const finalBalx = await f.daixBalanceOf(env, env.accounts[7].address);
    assert.equal(
      initialBalx.toString(),
      ethers.utils.parseEther("1000"),
      "account starting no supertokens"
    );
    assert.equal(
      initialBal.toString(),
      "0",
      "account starting with dai"
    );

    assert.equal(
      finalBalx.toString(),
      "0",
      "account ending with supertokens"
    );
    assert.equal(
      finalBal.toString(),
      ethers.utils.parseEther("1000"),
      "account end with dai"
    );
  });
  it("#2.2 - upgrade balance to same user (diff underlying decimals)", async () => {
    const upgrader = await f.deployNewUpgrader(env, [env.accounts[5].address], env.accounts[0].address);
    await f.mockMint(env, env.accounts[0]);
    // approves user balance to upgrade contract
    await f.mockApprove(env, env.accounts[0], upgrader.address);
    const initialBal = await f.superMockBalanceOf(env, env.accounts[0].address);

    // whitelist supertoken
    await upgrader.connect(env.accounts[0]).addSuperToken(env.tokens.mockSuperToken.address);
    // make upgrade to same account
    await upgrader.connect(env.accounts[5]).upgrade(env.tokens.mockSuperToken.address, env.accounts[0].address, "1");
    const finalBal = await f.superMockBalanceOf(env, env.accounts[0].address);
    assert.equal(
      initialBal.toString(),
      "0",
      "account starting with supertokens"
    );
    assert.equal(
      finalBal.toString(),
      f.scaleDecimalTo18(1, 6, 18),
      "account should get upgrade result"
    );
  });
});

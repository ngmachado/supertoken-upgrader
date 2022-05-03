module.exports = async function ({ deployments, getNamedAccounts }) {
    console.log("Start deployment - Kovan network");
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    const appLogic = await deploy("AppLogic", {
        from: deployer,
        log: true,
        skipIfAlreadyDeployed: true,
    });

    const cloneFactory = await deploy("CloneFactory", {
        from: deployer,
        args: [appLogic.address],
        log: true,
        skipIfAlreadyDeployed: true,
    });

    try {
        await hre.run("verify:verify", {
            address: appLogic.address,
            contract: "contracts/AppLogic.sol:AppLogic",
        });
    } catch (err) {
        console.error(err);
    }

    try {
        await hre.run("verify:verify", {
            address: cloneFactory.address,
            constructorArguments: [appLogic.address],
            contract: "contracts/CloneFactory.sol:CloneFactory",
        });
    } catch (err) {
        console.log(err);
    }
    console.log("Finish deployment - Kovan network");
    return {
        appLogicAddress : appLogic.address,
        cloneFactory: cloneFactory.address
    }
};

module.exports.tags = ["kovan"];
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {Errors} from "./libs/Errors.sol";

/*
    Security assumptions:
    - Upgrader is pre added to make operations.
    - Upgrader can make upgrades/downgrades to all accounts that approve this contract
    - Receiver can be any address, not locked to be the original account. eg. A -> Upgrade / Downgrade -> B
    - All SuperTokens are whitelisted by admin
    - Admin can add remove upgraders
*/

contract Upgrader is AccessControlEnumerable {

    // role identifier for upgrader caller
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_CALLER_ROLE_ID");
    mapping(ISuperToken => bool) public supportedSuperTokens;

    constructor(address default_admin_role, address[] memory upgraders) {
        if(default_admin_role == address(0)) revert Errors.ZeroAddress();
        _setupRole(DEFAULT_ADMIN_ROLE, default_admin_role);
        for (uint256 i = 0; i < upgraders.length; i++) {
            if(upgraders[i] == address(0)) revert Errors.ZeroAddress();
            _setupRole(UPGRADER_ROLE, upgraders[i]);
        }
    }

    /**
     * @notice The user should ERC20.approve this contract.
     * @notice SuperToken must be whitelisted before calling this function
     * @notice User can upgrade self balance
     * @dev Execute upgrade function in the name of the user.
     * @param superToken Super Token to upgrade
     * @param from User address that previous approved this contract.
     * @param to User address that receives tokens.
     * @param amount Amount value to be upgraded.
     */
    function upgrade(
        ISuperToken superToken,
        address from,
        address to,
        uint256 amount
    )
    external
    {
        if(!supportedSuperTokens[superToken]) revert Errors.SuperTokenNotSupported();
        if(!hasRole(UPGRADER_ROLE, msg.sender)) revert Errors.OperationNotAllowed();
        // get underlying token
        IERC20 token = IERC20(superToken.getUnderlyingToken());
        uint256 beforeBalance = superToken.balanceOf(address(this));
        // get tokens from user
        token.transferFrom(from, address(this), amount);
        //reset approve amount
        token.approve(address(superToken), 0);
        token.approve(address(superToken), amount);
        // upgrade tokens and send back to user
        superToken.upgrade(amount);
        // depends on the decimals of underlying token. We send the diff of balances
        superToken.transfer(to, superToken.balanceOf(address(this)) - beforeBalance);
    }

    /**
     * @notice The user should SuperToken.approve this contract.
     * @notice SuperToken must be whitelisted before calling this function
     * @notice User can downgrade self balance
     * @dev Execute upgrade function in the name of the user.
     * @param superToken Super Token to upgrade
     * @param from User address that previous approved this contract.
     * @param to User address that receives tokenss.
     * @param amount Amount value to be downgraded (in SuperToken decimals).
     */
    function downgrade(
        ISuperToken superToken,
        address from,
        address to,
        uint256 amount
    )
    external
    {
        if(!supportedSuperTokens[superToken]) revert Errors.SuperTokenNotSupported();
        if(!hasRole(UPGRADER_ROLE, msg.sender)) revert Errors.OperationNotAllowed();

        // get underlying token
        IERC20 token = IERC20(superToken.getUnderlyingToken());
        uint256 beforeBalance = token.balanceOf(address(this));
        superToken.transferFrom(from, address(this), amount);
        // downgrade tokens and send back to user
        superToken.downgrade(amount);
        // depends on the decimals of underlying token. We send the diff of balances
        token.transfer(to, token.balanceOf(address(this)) - beforeBalance);
    }

    /**
     * MANAGE SUPERTOKENS
     */

    function addSuperToken(ISuperToken superToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if(superToken.getUnderlyingToken() == address(0)) revert Errors.SuperTokenNotUnderlying();
        supportedSuperTokens[superToken] = true;
    }

    function removeSuperToken(ISuperToken superToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        delete supportedSuperTokens[superToken];
    }


    /**
     * ACCESS CONTROL
     */

    /**
     * @dev Allows admin to add address to upgrader role
     * @param newUpgradeCaller address
     */
    function addUpgrader(address newUpgradeCaller) external {
        if(newUpgradeCaller == address(0)) revert Errors.OperationNotAllowed();
        grantRole(UPGRADER_ROLE, newUpgradeCaller);
    }

    /**
     * @dev Allows admin to remove address from upgrader role
     * @param oldUpgradeCaller address
     */
    function revokeUpgrader(address oldUpgradeCaller) external {
        revokeRole(UPGRADER_ROLE, oldUpgradeCaller);
    }
}
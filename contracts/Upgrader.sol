// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import {ISuperToken} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {Errors} from "./libs/Errors.sol";
import {IERC20WithDecimals} from "./interfaces/IERC20.sol";

contract Upgrader is AccessControlEnumerable {

    // role identifier for upgrader caller
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_CALLER_ROLE_ID");
    mapping(ISuperToken => bool) public supportedSuperTokens;
    uint8 public constant SUPERTOKEN_DECIMALS = 18;

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
     * @param account User address that previous approved this contract.
     * @param amount Amount value to be upgraded.
     */
    function upgrade(
        ISuperToken superToken,
        address account,
        uint256 amount
    )
    external
    {
        if(!supportedSuperTokens[superToken]) revert Errors.SuperTokenNotSupported();
        if(msg.sender != account && !hasRole(UPGRADER_ROLE, msg.sender)) revert Errors.OperationNotAllowed();

        bool ok;
        // get underlying token
        IERC20WithDecimals token = IERC20WithDecimals(superToken.getUnderlyingToken());
        uint256 beforeBalance = superToken.balanceOf(address(this));
        // get tokens from user
        ok = token.transferFrom(account, address(this), amount);
        if(!ok) revert Errors.ERC20TransferFromRevert();
        //reset approve amount
        token.approve(address(superToken), 0);
        token.approve(address(superToken), amount);
        // scale amount if needed
        // upgrade tokens and send back to user
        superToken.upgrade(_toSuperTokenAmount(amount, token.decimals()));
        // decimals of underlying token can be different from supertoken. We send the diff of balances
        ok = superToken.transfer(account, superToken.balanceOf(address(this)) - beforeBalance);
        if(!ok) revert Errors.ERC20TransferRevert();
    }

    /**
     * @notice The user should SuperToken.approve this contract.
     * @notice SuperToken must be whitelisted before calling this function
     * @notice User can downgrade self balance
     * @dev Execute upgrade function in the name of the user.
     * @param superToken Super Token to upgrade
     * @param account User address that previous approved this contract.
     * @param amount Amount value to be downgraded (in SuperToken decimals).
     */
    function downgrade(
        ISuperToken superToken,
        address account,
        uint256 amount
    )
    external
    {
        if(!supportedSuperTokens[superToken]) revert Errors.SuperTokenNotSupported();
        if(msg.sender != account && !hasRole(UPGRADER_ROLE, msg.sender)) revert Errors.OperationNotAllowed();
        bool ok;
        // get underlying token
        IERC20WithDecimals token = IERC20WithDecimals(superToken.getUnderlyingToken());
        uint256 beforeBalance = token.balanceOf(address(this));
        ok = superToken.transferFrom(account, address(this), amount);
        if(!ok) revert Errors.ERC20TransferFromRevert();
        // downgrade tokens and send back to user
        superToken.downgrade(amount);
        // decimals of underlying token can be different from supertoken. We send the diff of balances
        ok = token.transfer(account, token.balanceOf(address(this)) - beforeBalance);
        if(!ok) revert Errors.ERC20TransferRevert();
    }

    function _toSuperTokenAmount(uint256 amount, uint8 decimals)
        private pure
        returns (uint256 adjustedAmount)
    {
        if (decimals < SUPERTOKEN_DECIMALS) {
            adjustedAmount = amount * (10 ** (SUPERTOKEN_DECIMALS - decimals));
        } else if (decimals > SUPERTOKEN_DECIMALS) {
            adjustedAmount = amount / (10 ** (decimals - SUPERTOKEN_DECIMALS));
        } else {
            adjustedAmount = amount;
        }
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

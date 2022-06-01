# Super Token Upgrader

Provides a contract which allows to upgrade to and downgrade from [Super Tokens](https://docs.superfluid.finance/superfluid/protocol-overview/super-tokens) on behalf of other accounts.  
For this to work, the contract needs to have been given a sufficient allowance from that accounts via `ERC20.approve()`.

The upgrade and downgrade operations can be triggered only by msg senders pre-approved by the contract admin through the _UPGRADER_ROLE_ using openzeppelin's [AccessControl](https://docs.openzeppelin.com/contracts/4.x/access-control) module.  
Furthermore, only Super Tokens flagged as _supported_ by the contract admin can be used.

The contract takes into account the possibility of the underlying ERC20 token's decimals differing from the default 18 decimals of Super Tokens. Note that in case of decimals mismatch, some token _dust_ could be left in the contract because of rounding artifacts.
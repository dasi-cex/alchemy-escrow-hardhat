// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Escrow {
	address public arbiter;
	address public beneficiary;
	address public depositor;

	bool public isApproved;

	constructor(address _arbiter, address _beneficiary) payable {
		arbiter = _arbiter;
		beneficiary = _beneficiary;
		depositor = msg.sender;
		require(depositor != arbiter, 'The creator of the contract cannot be the arbiter!');
	}

	event Approved(uint);

	function approve() external {
		require(msg.sender == arbiter, 'Only the arbiter can approve the contract!');
		require(!isApproved, 'Contract has already been approved!');
		uint balance = address(this).balance;
		(bool sent, ) = payable(beneficiary).call{value: balance}("");
 		require(sent, "Failed to send Ether");
		emit Approved(balance);
		isApproved = true;
	}
}

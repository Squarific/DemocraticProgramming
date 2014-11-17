function VoteManager (options) {
	this.options = options; //Array of strings
	this.votes = [];
}

VoteManager.prototype.reset = function reset () {
	this.votes = [];
};

VoteManager.prototype.vote = function vote (id, option) {
	if (this.hasAlreadyVoted(id))
		return false;

	if (!this.isValidOption(option))
		return false;

	this.votes.push({id: id, option: option});
};

VoteManager.prototype.hasAlreadyVoted = function hasAlreadyVoted (id) {
	for (var voteKey = 0; voteKey < this.votes.length; voteKey++) {
		if (this.votes[voteKey].id == id) {
			return true;
		}
	}

	return false;
};

VoteManager.prototype.isValidOption = function isValidOption (option) {
	for (var optionKey = 0; optionKey < this.options.length; optionKey) {
		if (this.options[optionKey] == option) {
			return true;
		}
	}

	return false;
};

VoteManager.prototype.getVoteCounts = function getVoteCounts () {
	var votes = {};

	for (var voteKey = 0; voteKey < this.votes.length; voteKey++) {
		if (!votes[this.votes[voteKey].option]) {
			votes[this.votes[voteKey].option] = 0;
		}

		votes[this.votes[voteKey].option] += 1;
	}

	return votes;
};

VoteManager.prototype.getWinner = function getWinner () {
	var votes = this.getVoteCounts();
	
	biggest = this.options[0];
	for (option in votes) {
		if (votes[option] > votes[biggest]) {
			biggest = option;
		}
	}

	return biggest;
};

VoteManager.prototype.getPropabilityWinner = function getPropabilityWinner () {
	return this.votes[Math.floor(Math.random() * this.votes.length)].option;
};

module.exports = VoteManager;
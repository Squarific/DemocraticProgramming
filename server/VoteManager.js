function VoteManager (options) {
	this.options = options; //Array of strings, if empty every string is allowed
	this.votes = [];
}

VoteManager.prototype.setOptions = function setOptions (options) {
	this.options = options || [];
	this.votes = [];
};

VoteManager.prototype.vote = function vote (id, option) {
	if (this.hasAlreadyVoted(id))
		return false;

	if (!this.isValidOption(option))
		return false;

	this.votes.push({id: id, option: option});
	return true;
};

VoteManager.prototype.changeVote = function changeVote (id, option) {
	if (!this.isValidOption(option))
		return false;

	for (var voteKey = 0; voteKey < this.votes.length; voteKey++) {
		if (this.votes[voteKey].id == id) {
			previous = this.votes[voteKey].option;
			this.votes[voteKey].option = option;
			return previous;
		}
	}

	return false;
}

VoteManager.prototype.hasAlreadyVoted = function hasAlreadyVoted (id) {
	for (var voteKey = 0; voteKey < this.votes.length; voteKey++) {
		if (this.votes[voteKey].id == id) {
			return true;
		}
	}

	return false;
};

VoteManager.prototype.isValidOption = function isValidOption (option) {
	if (this.options.length == 0)
		return true;

	for (var optionKey = 0; optionKey < this.options.length; optionKey++) {
		if (this.options[optionKey] == option) {
			return true;
		}
	}

	return false;
};

VoteManager.prototype.getVoteCount = function getVoteCount (option) {
	var count = 0;
	
	for (var voteKey = 0; voteKey < this.votes.length; voteKey++) {
		if (this.votes[voteKey].option == option) count++;
	}

	return count;
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

VoteManager.prototype.getProbabilityWinner = function getPropabilityWinner () {
	if (this.votes.length == 0) return false;
	return this.votes[Math.floor(Math.random() * this.votes.length)].option;
};

module.exports = VoteManager;
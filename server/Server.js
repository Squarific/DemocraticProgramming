function emptyfunction () {}

function Server (io, commandManager, voteManager, settings) {
	this.io = io;
	this.settings = settings;
	this.commandManager = commandManager;
	this.voteManager = voteManager;

	this.playercount = 0;
	this.current_command = "";
	this.current_parameters = [];

	// Bind socket events
	this.bindIO();

	// Vote on a new command
	this.voteManager.setOptions(this.commandManager.commandList);
	this.doNextVote();
}

Server.prototype.bindIO = function bindIO () {
	this.io.on("connection", function (socket) {
		socket.emit("timebetweenvotes", this.settings.timeBetweenVotes);
		this.sendVoteOptions(socket);
		this.playercount += 1;
		this.io.emit("playercount", this.playercount);

		socket.on("vote", function (option, callback) {
			callback = callback || emptyfunction;

			// Try to vote this option, if succeeds tell the other clients
			// And inform the client of success
			if (this.voteManager.vote(socket.id, option)) {
				this.io.emit("vote", option);
				callback(true);
			} else {
				callback("You have already voted!");
			}

			// Lower the wait when a vote is received but only
			// if that doesn't go below the minimum wait
			if (this.timeTillNextVote > this.settings.lowerVoteTimeAbove) {
				this.timeTillNextVote -= this.settings.lowerVoteTimeWith;
			}
		}.bind(this));

		socket.on("disconnect", function () {
			this.playercount -= 1;
			this.io.emit("playercount", this.playercount);

			if (this.playercount < 0) {
				console.log("WARNING: The playercount dropped below 0 (?). I went ahead and reset it to 0.");
			}
		}.bind(this));
	}.bind(this));
};

Server.prototype.sendVoteOptions = function setVoteOptions (socket) {
	var target = socket || this.io;
	target.emit("voteoptions", {
		timeTillNextVote: this.timeTillNextVote - Date.now(),
		options: this.getVoteOption()
	});
};

Server.prototype.voteupdate = function voteupdate () {
	if (this.timeTillNextVote - Date.now() <= 0) {
		if (!this.current_command) {
			var vote_winner = this.voteManager.getPropabilityWinner();

			if (!(vote_winner in this.commandManager.commands)) {
				console.log("WARNING: Voted option '" + vote_winner + "' was not a valid command!");
				this.voteOnNewCommand();
				return;
			}

			this.current_command = this.vote_winner;
		}

		this.executeCurrentCommand();
	}
};

Server.prototype.executeCurrentCommand = function executeCurrentCommand () {
	if (this.commandManager.requiredArguments(this.current_command) == this.current_parameters.length) {
		this.commandManager.runCommand(
			this.current_command,
			this.current_parameters,
			function (err) {
				if (err) console.log("WARNING: Couldn't execute command '" + this.current_command + "' with parameters '", this.current_parameters, "' Error: ", err);
				// Vote on a new command
				this.voteManager.setOptions(this.commandManager.commandList);
				this.doNextVote();
			}.bind(this)
		);
	} else {
		// Allow a vote on any string
		this.voteManager.setOptions([]);
		this.doNextVote();
	}
};

Server.prototype.doNextVote = function doNextVote () {
	// Prepare for the next vote
	this.sendVoteOptions();
	this.timeTillNextVote = Date.now() + this.settings.timeBetweenVotes;
	clearTimeout(this.voteUpdateTimeout);
	this.voteUpdateTimeout = setTimeout(this.voteupdate.bind(this), 2000);
};

Server.prototype.getVoteOption = function getVoteOption () {
	// Return the current options or if no options are set return
	// The paremeter we are voting on and all the voted options
	return this.voteManager.options || {
		parameter: this.commandManager.getParameter(this.current_command, this.current_parameters.length),
		currently_voted: this.voteManager.getVoteCounts()
	};
};

module.exports = Server;
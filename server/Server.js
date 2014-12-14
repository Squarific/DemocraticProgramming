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
	this.voteUpdateTimeout = setTimeout(this.voteupdate.bind(this), 2000);
}

Server.prototype.generateName = function () {
	return "user-" + Math.random().toString(36).substr(2, 5);
};

Server.prototype.bindIO = function bindIO () {
	console.log("Server started.");

	this.io.on("connection", function (socket) {
		socket.name = this.generateName();
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
				callback(option);
			} else if (this.voteManager.changeVote(socket.id, option)) {
				callback(option);
			} else {
				callback("ILLEGAL");
			}

			// Lower the wait when a vote is received but only
			// if that doesn't go below the minimum wait
			if (this.timeTillNextVote > this.settings.lowerVoteTimeAbove) {
				this.timeTillNextVote -= this.settings.lowerVoteTimeWith;
			}
		}.bind(this));

		socket.on("chat", function (message) {
			this.sendChat(socket.name, message.substring(0, 255));
			console.log("Chat:", this.name, message);
		}.bind(this));

		socket.on("disconnect", function () {
			this.playercount -= 1;
			this.io.emit("playercount", this.playercount);

			if (this.playercount < 0) {
				console.log("WARNING: The playercount dropped below 0 (?). I went ahead and reset it for you.");
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
		var vote_winner = this.voteManager.getProbabilityWinner();

		// Time's up, if we don't have one yet lets see what command won
		if (!this.current_command) {
			if (!vote_winner && typeof vote_winner == "boolean") {
				console.log("No valid vote casted, giving more time.");
				this.sendChat("<System>", "No valid vote casted, giving more time.");
				this.timeTillNextVote += this.settings.timeBetweenVotes;
				this.doNextVote();
				this.voteUpdateTimeout = setTimeout(this.voteupdate.bind(this), 2000);
				return;
			}
			if (!(vote_winner in this.commandManager.commands)) {
				// That's not a valid command o.0
				console.log("WARNING: Voted option '" + vote_winner + "' was not a valid command!");
				this.voteOnNewCommand();
				this.voteUpdateTimeout = setTimeout(this.voteupdate.bind(this), 2000);
				return;
			}

			this.current_command = vote_winner;
			this.sendChat("<System>", "Command '" + vote_winner + "' has won!");
		} else {
			// We already got a command, lets add it as a parameter
			this.current_parameters.push(vote_winner);
		}

		// Ok so we got a command now, lets execute it
		this.executeCurrentCommand();
	}	
	this.voteUpdateTimeout = setTimeout(this.voteupdate.bind(this), 2000);
};

Server.prototype.voteOnNewCommand = function voteOnNewCommand () {
	this.current_command = "";
	this.current_parameters = [];
	this.voteManager.setOptions(this.commandManager.commandList);
	this.doNextVote();
};

Server.prototype.executeCurrentCommand = function executeCurrentCommand () {
	if (this.commandManager.requiredParameters(this.current_command) <= this.current_parameters.length) {
		// We have the required parameters, lets execute
		this.commandManager.runCommand(
			this.current_command,
			this.current_parameters,
			function (err) {
				if (err) console.log("WARNING: Couldn't execute command '" + this.current_command + "' with parameters '", this.current_parameters, "' Error: ", err);
				console.log("Ran command ", this.current_command, "Parameters", this.current_parameters);
				this.sendChat("<System>", "Executed " + this.current_command + " with parameters '" + this.current_parameters.join(", ") + "'");
				// Vote on a new command
				this.voteOnNewCommand();
			}.bind(this)
		);
	} else {
		// Allow a vote on any string since we still need a parameter
		this.voteManager.setOptions([]);
		this.doNextVote();
	}
};

Server.prototype.sendChat = function sendChat (user, message) {
	this.io.emit("chat", {
		user: user,
		message: message
	});
};

Server.prototype.doNextVote = function doNextVote () {
	// Prepare for the next vote
	this.timeTillNextVote = Date.now() + this.settings.timeBetweenVotes;
	this.sendVoteOptions();
};

Server.prototype.getVoteOption = function getVoteOption () {
	// Return the current options or if no options are set return
	// The paremeter we are voting on and all the voted options
	if (this.voteManager.options.length !== 0) {
		return this.voteManager.options;
	}
	return {
		parameter: this.commandManager.getParameter(this.current_command, this.current_parameters.length),
		currently_voted: this.voteManager.getVoteCounts()
	};
};

module.exports = Server;
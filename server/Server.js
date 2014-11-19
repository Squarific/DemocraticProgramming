function Server (io, commandManager, voteManager, settings) {
	this.io = io;
	this.settings = settings;
	this.commandManager = commandManager;
	this.voteManager = voteManager;
	this.playerCount = 0;

	this.current_command = "";
	this.current_parameters = [];

	this.bindIO();
	this.voteOnNewCommand();

	setInterval(this.sendPlayerCount.bind(this), 2000);
}

Server.prototype.bindIO = function bindIO () {
	var current_server = this,
		voteManager = this.voteManager,
		commandManager = this.commandManager;

	this.io.on("connection", function (socket) {
		socket.emit("voteoptions", this.getVoteOption());
		socket.emit("playercount", current_server.playercount);

		socket.on("connect", function () {
			current_server.playercount += 1;
		});

		socket.on("vote", function (option) {
			voteManager.vote(socket.id, option);
			if (this.timeTillNextVote > this.settings.lowerVoteTimeAbove) {
				this.timeTillNextVote -= this.settings.lowerVoteTimeWith;
			}
		});

		socket.on("disconnect", function () {
			current_server.playercount -= 1;

			if (current_server.playercount < 0) {
				console.log("WARNING: The playercount dropped below 0 (?). I went ahead and reset it to 0.");
			}
		});
	});

};

Server.prototype.sendPlayerCount = function sendPlayerCount () {
	this.io.emit("playercount", this.playerCount);
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
			this.voteOnNewCommand.bind(this)
		);
	} else {
		this.voteOnNextArgument();
	}
};

Server.prototype.voteOnNewCommand = function voteOnNewCommand () {
	this.voteManager.setOptions(this.commandManager.commands);
	this.timeTillNextVote = Date.now() + this.settings.timeBetweenVotes;
	this.setVoteTimeout();
};

Server.prototype.voteOnNextArgument = function voteOnNextArgument () {
	this.voteManager.setOptions([]);
	this.timeTillNextVote = this.settings.timeBetweenVotes;
	this.setVoteTimeout();
};

Server.prototype.setVoteTimeout = function setVoteTimeout () {
	clearTimeout(this.voteUpdateTimeout);
	this.voteUpdateTimeout = setTimeout(this.voteupdate.bind(this), 2000);
};

Server.prototype.getVoteOption = function getVoteOption () {
	return this.voteManager.options || this.commandManager.getParameter(this.current_command, this.current_parameters.length);
};

module.exports = Server;
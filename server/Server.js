var fs = require("fs");
function emptyfunction () {}

function Server (io, commandManager, voteManager, settings) {
	this.io = io;
	this.settings = settings;
	this.commandManager = commandManager;
	this.commandManager.server = this;
	this.voteManager = voteManager;

	this.playercount = 0;
	this.current_command = "";
	this.current_parameters = [];
	this.current_goal = "There is no goal yet, try voting for one!";

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
		console.log(socket)
		if (socket.handshake.headers.referer && socket.handshake.headers.referer.indexOf("unsafe.html") > -1) socket.disconnect();
		socket.name = this.generateName();
		socket.emit("timebetweenvotes", this.settings.timeBetweenVotes);
		socket.emit("goal", this.current_goal);
		console.log(socket);

		if (this.current_command) {
			socket.emit("chat", {
				user: "<System>",
				message: "Current command: '" + this.current_command + "'' current parameters: '" + this.current_parameters.join(", ") + "'"
			});
		}
		
		this.sendVoteOptions(socket);
		this.playercount += 1;
		this.io.emit("playercount", this.playercount);
		socket.vote_id = socket.request.connection.remoteAddress;
		console.log(socket.vote_id, "connected.");
		
		this.getSourceFile(function (data) {
			socket.emit("sourcefile", data);
		});

		socket.on("changename", function (name) {
			name = name.split("<").join("").split(">").join("")
			this.sendChat("<system>", socket.name + " has changed hes name to " + name)
			socket.name = name;
		}.bind(this));

		socket.on("vote", function (option, callback) {
			callback = callback || emptyfunction;

			// Try to vote this option, if succeeds tell the other clients
			// And inform the client of success
			if (this.voteManager.vote(socket.vote_id, option)) {
				// Lower the wait when a vote is received but only
				// if that doesn't go below the minimum wait
				if (this.timeTillNextVote - Date.now() > this.settings.lowerVoteTimeAbove) {
					this.timeTillNextVote -= this.settings.lowerVoteTimeWith;
		6		}

				this.io.emit("vote", {
					option: option,
					votes: this.voteManager.getVoteCount(option),
					timeleft: this.timeTillNextVote - Date.now()
				});
				callback(option);
			} else {
				previous = this.voteManager.changeVote(socket.vote_id, option);
				if (previous) {
					// Let the client know it needs to update the vote count of 2 votes
					this.io.emit("votes", [{
						option: previous,
						votes: this.voteManager.getVoteCount(previous),
						timeleft: this.timeTillNextVote - Date.now()
					},{
						option: option,
						votes: this.voteManager.getVoteCount(option),
						timeleft: this.timeTillNextVote - Date.now()
					}]);
					callback(option);
				} else {
					callback("ILLEGAL");
				}
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
			this.sendChat("<System>", "Parameter '" + vote_winner + "' has won!");
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
			function (err, data) {
				if (err) console.log("WARNING: Couldn't execute command '" + this.current_command + "' with parameters '", this.current_parameters, "' Error: ", err);
				console.log("Ran command ", this.current_command, "Parameters", this.current_parameters);
				this.sendChat("<System>", "Executed " + this.current_command + " with parameters '" + this.current_parameters.join(", ") + "'");
				this.io.emit("commanddata", data);
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

Server.prototype.getSourceFile = function getSourceFile (callback) {
	fs.readFile(this.commandManager.filename, {encoding: "utf8"}, function (err, data) {
		if (err) {
			console.log(err);
			return "Error retrieving source file";
		}
		callback(data);
	})
};

Server.prototype.getVoteOption = function getVoteOption () {
	// Return the current options or if no options are set return
	// The paremeter we are voting on and all the voted options
	if (this.voteManager.options.length !== 0) {
		return {
			options: this.voteManager.options,
			currently_voted: this.voteManager.getVoteCounts()
		};
	}
	return {
		parameter: this.commandManager.getParameter(this.current_command, this.current_parameters.length),
		currently_voted: this.voteManager.getVoteCounts()
	};
};

module.exports = Server;
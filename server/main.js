var CommandManager = require("./CommandManager.js");
var VoteManager = require("./VoteManager.js");
var IoServer = require("socket.io");
var Server = require("./server.js");

var server = new Server(
	IoServer(80),
	new CommandManager(),
	new VoteManager(cm.commandList), {
		lowerVoteTimeAbove: 1.5 * 60 * 1000,
		lowerVoteTimeWith: 2 * 1000,
		timeBetweenVotes: 5 * 60 * 1000
	}
);
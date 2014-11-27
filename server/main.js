var CommandManager = require("./CommandManager.js");
var VoteManager = require("./VoteManager.js");
var IoServer = require("socket.io");
var Server = require("./Server.js");
var Git = require("./gittens/main.js");

Git.open("./data", function (err, repo) {
	if (err) throw err;
	startServer(80, "./data/code.py", repo);
});

function startServer (port, file, repo) {
	var server = new Server(
		IoServer(port),
		new CommandManager(file, repo),
		new VoteManager(), {
			lowerVoteTimeAbove: 10 * 1000,
			lowerVoteTimeWith: 2 * 1000,
			timeBetweenVotes:  10 * 1000
		}
	);
}


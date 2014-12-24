var CommandManager = require("./CommandManager.js");
var VoteManager = require("./VoteManager.js");
var IoServer = require("socket.io");
var Server = require("./Server.js");
var Git = require("./gittens/main.js");

Git.open("./data", function (err, repo) {
	if (err) throw err;
	startServer(8080, "./data/code.py", repo);
});

function startServer (port, file, repo) {
	var server = new Server(
		IoServer(port),
		new CommandManager(file, repo),
		new VoteManager(), {
			lowerVoteTimeAbove:  30 * 1000,
			lowerVoteTimeWith: 10 * 1000,
			timeBetweenVotes:  2 * 60 * 1000,
			timeBetweenParamVotes: 1 * 60 * 1000
		}
	);
}


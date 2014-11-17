var CommandManager = require("./CommandManager.js");
var VoteManager = require("./VoteManager.js");
var ioserver = require("socket.io");

function Server (io, commandManager, voteManager) {
	var current_server = this;
	this.playerCount = 0

	io.on("connection", function (socket) {
		socket.on("connect", function () {
			current_server.playercount += 1;
		});

		socket.on("vote", function () {

		});

		socket.on("disconnect", function () {
			current_server.playercount -= 1;

			if (current_server.playercount < 0) {
				console.log("WARNING: The playercount dropped below 0 (?). I went ahead and reset it to 0.");
			}
		});
	});

	var playerCountInterval = setInterval(this.sendPlayerCount, 2000);
}

Server.prototype.sendPlayerCount = function sendPlayerCount () {
	io.emit("playercount", this.playerCount);
};

var cm = new CommandManager();
var vm = new VoteManager(["commit", "push", "changeLine"]);
var io = ioserver(80);

var server = new Server(io, cm, vm);
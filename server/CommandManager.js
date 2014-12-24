var fs = require("fs");

var params = {
	commitmessage: "Commit message",
	linenumber: "Linenumber",
	code: "Line of code",
	goal: "Goal message"
};

var functions = {
	commit: function commit (message, callback) {
		message = message + ""; //Ensure string
		this.repo.add("*", function () {
			this.repo.commit(message, function () {
				this.repo.push("origin", "master", function (err) {
					callback(undefined, {type: 3})
				});
			}.bind(this))
		}.bind(this))
	},
	changeline: function changeline (linenumber, code, callback) {
		fs.readFile(this.filename, {encoding: "utf8"}, function (err, data) {
			lines = data.split("\n");
			linenumber = parseFloat(linenumber);
			linenumber = Math.min(Math.min(1000, lines.length + 5), linenumber);
			code = code + "" //Ensure code is a string
			code = code.split("\n").join(" "); //Escape new lines

			if (isNaN(linenumber)) {
				callback("That is not parseable as a number!");
				return;
			}
			
			if (Math.floor(linenumber) !== Math.ceil(linenumber)) {
				lines.splice(Math.floor(linenumber), 0, code.substring(0, 250));
			} else {
				lines[linenumber - 1] = code.substring(0, 250);
			}

			fs.writeFile(this.filename, lines.join("\n"), {encoding: "utf8"}, function (err) {
				callback(err, {
					type: 0,
					linenumber: linenumber,
					source: code.substring(0, 250)
				});
			});
		}.bind(this));
	},
	deleteline: function deleteline (linenumber, callback) {
		fs.readFile(this.filename, {encoding: "utf8"}, function (err, data) {
			lines = data.split("\n");
			linenumber = Math.round(parseFloat(linenumber));

			if (isNaN(linenumber)) {
				callback("That is not parseable as a number!");
				return;
			}

			lines.splice(linenumber - 1, 1);
			fs.writeFile(this.filename, lines.join("\n"), function (err) {
				callback(err, {
					type: 1,
					linenumber: linenumber
				});
			});
		}.bind(this));
	},
	setgoal: function setgoal (message, callback) {
		message = message || "There is no goal yet, try voting for one!";
		message = message + "" //Ensure string
		this.server.current_goal = message.substring(0, 255);
		callback(undefined, {
			type: 2,
			goal: message.substring(0, 255)
		});
	}
};

function CommandManager (filename, repo) {
	this.server = {};
	this.filename = filename;
	this.repo = repo;
}

CommandManager.prototype.runCommand = function runCommand (command, params, callback) {
	if (this.commands[command] && typeof this.commands[command].exec == "function") {
		var argArray = params.slice(); // Make a copy of the array
		argArray.push(callback);
		this.commands[command].exec.apply(this, argArray);
	} else {
		callback("Command " + command + " not found");
	}
};

CommandManager.prototype.requiredParameters = function requiredParameters (command) {
	if (!this.commands[command]) {
		return false;
	}
	return this.commands[command].parameters.length;
};

CommandManager.prototype.getParameter = function getParameter (command, param) {
	if (!this.commands[command]) {
		return false;
	}
	return this.commands[command].parameters[param];
};

CommandManager.prototype.commands = {
	commit: {
		parameters: [params.commitmessage],
		exec: functions.commit
	},
	changeline: {
		parameters: [params.linenumber, params.code],
		exec: functions.changeline
	},
	deleteline: {
		parameters: [params.linenumber],
		exec: functions.deleteline
	},
	setgoal: {
		parameters: [params.goal],
		exec: functions.setgoal
	}
};

CommandManager.prototype.commandList = [];
for (var k in CommandManager.prototype.commands) {
	CommandManager.prototype.commandList.push(k);
}

module.exports = CommandManager;
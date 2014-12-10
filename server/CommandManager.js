var fs = require("fs");

var params = {
	commitmessage: "This is the message displayed on github and in the git history",
	linenumber: "The linenumber is the number of the line in the source file, this can be an integer (1, 2, 3, 4) or a float (1.4, 3.5, 6.9) in case it is a float then a new line will be created between min(number) and max(number)",
	code: "This is a string containing python code"
};

var functions = {
	commit: function commit (message, callback) {
		this.repo.add("*", function () {
			this.repo.commit(message, function () {
				this.repo.push("origin", "master", callback);
			})
		})
	},
	changeline: function changeline (linenumber, code, callback) {
		fs.readFile(this.filename, {encoding: "utf8"}, function (err, data) {
			lines = data.split("\n");
			linenumber = parseFloat(linenumber);

			if (isNaN(linenumber)) {
				callback("That is not parseable as a number!");
				return;
			}
			
			if (Math.min(linenumber) !== Math.max(linenumber)) {
				lines.splice(Math.min(linenumber), 0, code);
			} else {
				lines[linenumber - 1] = code;
			}

			fs.writeFile(this.filename, lines.join("\n"), {encoding: "utf8"}, callback);
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

			lines.splice(linenumber, 1);
			fs.writeFile(this.filename, lines.join("\n"), callback);
		});
	}
};

function CommandManager (filename, repo) {
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
	}
};

CommandManager.prototype.commandList = [];
for (var k in CommandManager.prototype.commands) {
	CommandManager.prototype.commandList.push(k);
}

module.exports = CommandManager;
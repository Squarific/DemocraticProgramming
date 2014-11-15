var fs = require("fs");

var params = {
	commitmessage: "This is the message displayed on github and in the git history",
	linenumber: "The linenumber is the number of the line in the source file, this can be an integer (1, 2, 3, 4) or a float (1.4, 3.5, 6.9) in case it is a float then a new line will be created between min(number) and max(number)",
	code: "This is a string containing python code"
};

var functions = {
	commit: function (message, callback) {
		this.repo.commit(message, callback)
	},
	push: function (callback) {
		this.repo.push("origin", "master", callback)
	},
	changeline: function (linenumber, code, callback) {
		fs.readFile(this.filename, {encoding: "utf8"}, function (err, data) {
			lines = data.split("\n");

			if (Math.min(linenumber) !== Math.max(linenumber)) {
				lines.splice(Math.max(linenumber), 0, code);
			} else {
				lines[linenumber - 1] = code;
			}
			fs.writeFile(this.filename, lines.join("\n"), callback);
		});
	}
};

function CommandManager (filename, repo) {
	this.filename = filename;
	this.repo = repo;
}

CommandManager.prototype.runcommand = function runcommand (command, params, callback) {
	if (typeof this.commands[command].exec == "function") {
		this.commands[command].exec.apply(this, params, callback);
	}
};

CommandManager.prototype.commands = {
	commit: {
		parameters: [params.commitmessage],
		exec: functions.commit
	},
	push: {
		parameters: [],
		exec: functions.push
	},
	changeline: {
		parameters: [params.linenumber, params.code],
		exec: functions.changeline
	}
};

module.exports = CommandManager();
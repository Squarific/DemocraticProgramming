function Client () {
	this.statusElement = document.getElementById("connectionstatus");;
	this.usercountElement = document.getElementById("usercount");
	this.chat = new Chat(document.getElementById("chat"), function (message) {
		this.socket.emit("chat", message);
	}.bind(this));

	//this.socket = io('http://democraticprogramming.squarific.com:8080');
	this.socket = io('http://127.0.0.1:8080');

	this.socket.on("connect", function () {
		this.statusElement.innerText = "Connected.";
		document.body.classList.add("connected");
		if (name = localStorage.getItem("sdp-username")) {
			this.socket.emit("changename", name);
		}
	}.bind(this));

	this.socket.on("reconnect", function () {
		this.statusElement.innerText = "Connected.";
		document.body.classList.add("connected");
	}.bind(this));

	this.socket.on("disconnect", function () {
		this.statusElement.innerText = "Not connected.";
		document.body.classList.remove("connected");
	}.bind(this));

	this.socket.on("timebetweenvotes", function (timebetween) {
		var votefield = document.getElementById("votefield");
		while (votefield.lastChild) {
			votefield.removeChild(votefield.lastChild);
		}

		if (this.poll) this.poll.stopped = true;
		this.poll = new Poll(timebetween, votefield, function (option) {
			this.socket.emit("vote", option, function (data) {
				this.poll.statusTextDom.innerHTML = "<h2>You have voted for: " + data + "</h2>";
				console.log("Vote response: ", data);
			}.bind(this));
		}.bind(this));
	}.bind(this));

	this.socket.on("commanddata", function (data) {
		console.log("Commanddata", data);
		if (!data) return;
		//data = {
		//    type: 0 = changeline, 1 = deleteline, 2 = setgoal
		//    linenumber: number,
		//    source: string
		//}

		if (data.type == 0) {
			this.changeline(data);
		} else if (data.type == 1) {
			this.deleteline(data);
		} else if (data.type == 2) {
			this.setgoal(data.goal);	
		}

	}.bind(this));

	this.socket.on("sourcefile", function (data) {
		sourceDom = document.getElementById("sourcefile");
		sourceDom[('innerText' in sourceDom)? 'innerText' : 'textContent'] = data;
		sourceDom.current_source = data;
		Prism.highlightElement(sourceDom);
	});

	this.socket.on("chat", function (data) {
		this.chat.addMessage(data.user, data.message);
	}.bind(this));

	this.socket.on("playercount", function (users) {
		this.usercountElement.innerText = users;
	}.bind(this));

	this.socket.on("vote", function (data) {
		this.poll.voted(data.option, data.votes, data.timeleft);
	}.bind(this));

	this.socket.on("votes", function (data) {
		for (var k = 0; k < data.length; k++) {
			this.poll.voted(data[k].option, data[k].votes, data[k].timeleft);
		}
	}.bind(this));

	this.socket.on("voteoptions", function (data) {
		this.poll.setVoteData(data);
		console.log("Voteoptions data: ", data);
	}.bind(this));

	this.socket.on("goal", function (data) {
		this.setgoal(data);
	}.bind(this))

	this.socket.emit("asksourcefile");
}

Client.prototype.changeline = function changeline (data) {
	var sourceDom = document.getElementById("sourcefile");
	var lines = sourceDom.current_source.split("\n");
	if (Math.floor(data.linenumber) !== Math.ceil(data.linenumber)) {
		lines.splice(Math.floor(data.linenumber), 0, data.source);
	} else {
		lines[data.linenumber - 1] = data.source.substring(0, 250);
	}
	sourceDom.current_source = lines.join("\n");
	sourceDom[('innerText' in sourceDom)? 'innerText' : 'textContent'] = sourceDom.current_source;
	Prism.highlightElement(sourceDom);
};

Client.prototype.deleteline = function deleteline (data) {
	var sourceDom = document.getElementById("sourcefile");
	var lines = sourceDom.current_source.split("\n");
	lines.splice(data.linenumber - 1, 1);
	sourceDom.current_source = lines.join("\n");
	sourceDom[('innerText' in sourceDom)? 'innerText' : 'textContent'] = sourceDom.current_source;
	Prism.highlightElement(sourceDom);
};

Client.prototype.setgoal = function setgoal (data) {
	var goalDom = document.getElementById("goalmessage");
	while (goalDom.firstChild) {
		goalDom.removeChild(goalDom.firstChild);
	}
	goalDom.appendChild(document.createTextNode(data));
};

Client.prototype.setUsername = function setUsername (name) {
	this.socket.emit("changename", name);
	localStorage.setItem("sdp-username", name);
};

Client.prototype.createExitButton = function createExitButton () {
	var button = document.createElement("div");
	button.classList.add("button-least");
	button.classList.add("button-exit");
	button.style.float = "right";
	button.appendChild(document.createTextNode("Exit"));
	button.addEventListener("click", function (event) {
		event.target.parentNode.parentNode.removeChild(event.target.parentNode);
	});
	return button;
};

Client.prototype.createCodeIframe = function createCodeIframe () {
	var iframe = document.createElement("iframe");
	iframe.addEventListener("load", function (event) {
		this.contentWindow.postMessage(document.getElementById("sourcefile").current_source, "*");
	}.bind(iframe))
	iframe.src = "http://www.tazios.com/unsafe.html";
	return iframe;
};

Client.prototype.runCode = function runCode () {
	var runConsoleContainer = document.body.appendChild(document.createElement("div"));
	runConsoleContainer.classList.add("run-console-container");
	runConsoleContainer.appendChild(this.createExitButton());

	var h2 = runConsoleContainer.appendChild(document.createElement("h2"));
	h2.appendChild(document.createTextNode("Console"));

	runConsoleContainer.targetiframe = runConsoleContainer.appendChild(this.createCodeIframe());
	runConsoleContainer.targetiframe.contentWindow.postMessage(document.getElementById("sourcefile").current_source, "*");
	runConsoleContainer.targetiframe.classList.add("run-console-iframe");

	setTimeout(function () {
		this.classList.add("run-console-container-opened");
	}.bind(runConsoleContainer), 0);
};

client = new Client();
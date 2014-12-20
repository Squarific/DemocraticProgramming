function Client () {
	this.statusElement = document.getElementById("connectionstatus");;
	this.usercountElement = document.getElementById("usercount");
	this.chat = new Chat(document.getElementById("chat"), function (message) {
		this.socket.emit("chat", message);
	}.bind(this));

	this.socket = io('http://127.0.0.1:80');
	//this.socket = io('http://democraticprograming.squarific.com:80');

	this.socket.on("connect", function () {
		this.statusElement.innerText = "Connected.";
		document.body.classList.add("connected");
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

		this.poll = new Poll(timebetween, votefield, function (option) {
			this.socket.emit("vote", option, function (data) {
				this.poll.statusTextDom.innerHTML = "<h2>You have voted for: " + data + "</h2>";
				console.log("Vote response: ", data);
			}.bind(this));
		}.bind(this));
	}.bind(this));

	this.socket.on("commanddata", function (data) {
		if (!data) return;
		//data = {
		//    type: 0 = changeline, 1 = deleteline,
		//    linenumber: number,
		//    source: string
		//}
		sourceDom = document.getElementById("sourcefile");
		lines = sourceDom.current_source.split("\n");

		if (data.type == 0) {
			if (Math.min(data.linenumber) !== Math.max(data.linenumber)) {
				lines.splice(Math.min(data.linenumber), 0, data.source);
			} else {
				lines[data.linenumber - 1] = data.source.substring(0, 250);
			}
		} else if (data.type == 1) {
			lines.splice(data.linenumber - 1, 1);
		}

		sourceDom.current_source = lines.join("\n");
		sourceDom[('innerText' in sourceDom)? 'innerText' : 'textContent'] = sourceDom.current_source;
		Prism.highlightElement(sourceDom);
	});

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

	this.socket.emit("asksourcefile");
}

client = new Client();
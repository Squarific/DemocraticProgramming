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

	this.socket.on("chat", function (data) {
		this.chat.addMessage(data.user, data.message);
	}.bind(this));

	this.socket.on("playercount", function (users) {
		this.usercountElement.innerText = users;
	}.bind(this));

	this.socket.on("voteoptions", function (data) {
		this.poll.setVoteData(data);
		console.log("Voteoptions data: ", data);
	}.bind(this));
}

client = new Client();
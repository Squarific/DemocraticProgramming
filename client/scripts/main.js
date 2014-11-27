//var socket = io('http://democraticprograming.squarific.com:80');
var socket = io('http://127.0.0.1:80');

function Client () {
	this.statusElement = document.getElementById("connectionstatus");;
	this.usercountElement = document.getElementById("usercount");
	this.consoleElement = document.getElementById("console");

	socket.on("connect", function () {
		this.statusElement.innerText = "Connected.";
		document.body.classList.add("connected");
	}.bind(this));

	socket.on("reconnect", function () {
		this.statusElement.innerText = "Connected.";
		document.body.classList.add("connected");
	}.bind(this));

	socket.on("disconnect", function () {
		this.statusElement.innerText = "Not connected.";
		document.body.classList.remove("connected");
	}.bind(this));

	socket.on("timebetweenvotes", function (timebetween) {
		var votefield = document.getElementById("votefield");
		while (votefield.lastChild) {
			votefield.removeChild(votefield.lastChild);
		}
		this.poll = new Poll(timebetween, votefield);
	}.bind(this));

	socket.on("playercount", function (users) {
		this.usercountElement.innerText = users;
	}.bind(this));

	socket.on("voteoptions", function (data) {
		this.poll.setVoteData(data);
	}.bind(this));
}

client = new Client();
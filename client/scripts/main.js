//var socket = io('http://democraticprograming.squarific.com:80');
var socket = io('http://127.0.0.1:80');

var statusElement = document.getElementById("connectionstatus");;
var usercountElement = document.getElementById("usercount");
var consoleElement = document.getElementById("console");

socket.on("connect", function () {
	statusElement.innerText = "Connected.";
	document.body.classList.add("connected");
});

socket.on("reconnect", function () {
	statusElement.innerText = "Connected.";
	document.body.classList.add("connected");
});

socket.on("disconnect", function () {
	statusElement.innerText = "Not connected.";
	document.body.classList.remove("connected");
});

socket.on("playercount", function (users) {
	usercountElement.innerText = users;
});

socket.on("voteoptions", function (data) {
	console.log(data);
});
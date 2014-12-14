function Poll (timebetween, container, votecallback) {
	this.timebetween = timebetween;
	this.timeTillNextVote = 0;
	this.container = container;
	this.votecallback = votecallback;

	this.statusTextDom = this.container.appendChild(document.createElement("span"));
	this.pollTimeDom = this.createPollTimeDom(container);
	votetext = this.container.appendChild(document.createElement("span"));
	votetext.innerHTML = "<h2>Vote for one of the following options:</h2>";
	this.voteOptionsDom = container.appendChild(document.createElement("div"));

	this.inputContainerDom = this.container.appendChild(document.createElement("div"));
	this.inputContainerDom.classList.add("inputcontainer-poll");
	this.inputContainerDom.style.display = "none";
	this.input = this.inputContainerDom.appendChild(document.createElement("input"));
	button = this.inputContainerDom.appendChild(document.createElement("div"));
	button.classList.add("button-poll-vote");
	button.classList.add("voteoption");
	button.appendChild(document.createTextNode("Vote!"));
	button.addEventListener("click", this.voteinput.bind(this));
	
	requestAnimationFrame(this.update.bind(this));
}

Poll.prototype.update = function update () {
	this.pollTimeDom.style.width = Math.max((this.timeTillNextVote - Date.now()) / this.timebetween, 0) * 100 + "%";
	this.pollTimeDom.innerHTML = Math.max(Math.round((this.timeTillNextVote - Date.now()) / 1000), 0) + " seconds left.";
	requestAnimationFrame(this.update.bind(this));
};

Poll.prototype.createPollTimeDom = function createPollTimeDom (container) {
	pollTimeDomContainer = container.appendChild(document.createElement("div"))
	pollTimeDom = pollTimeDomContainer.appendChild(document.createElement("div"))

	pollTimeDomContainer.classList.add("polltimebarcontainer");
	pollTimeDom.classList.add("polltimebar");

	return pollTimeDom;
};

Poll.prototype.voteinput = function () {
	this.vote(this.input.value);
};

Poll.prototype.vote = function vote (option) {
	this.votecallback(option);
};

Poll.prototype.addVoteOption = function addVoteOption (container, option) {
	var optionDom = container.appendChild(document.createElement("div"));
	optionDom.classList.add("voteoption");
	optionDom.innerHTML = option;
	optionDom.addEventListener("click", this.vote.bind(this, option));
};

Poll.prototype.setVoteOptionsFromList = function setVoteOptionsFromList (options) {
	while (this.voteOptionsDom.firstChild) {
		this.voteOptionsDom.removeChild(this.voteOptionsDom.firstChild);
	}

	for (var k = 0; k < options.length; k++) {
		this.addVoteOption(this.voteOptionsDom, options[k]);
	}
};



Poll.prototype.setVoteData = function setVoteData (data) {
	this.timeTillNextVote = Date.now() + data.timeTillNextVote;
	console.log(data);
	if (typeof data.options.length == "number") {
		this.setVoteOptionsFromList(data.options);
	} else {
		this.setVoteOptionsFromVotes(data.options);
	}
};
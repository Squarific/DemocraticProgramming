function Poll (timebetween, container, votecallback) {
	this.timebetween = timebetween;
	this.timeTillNextVote = 0;
	this.container = container;
	this.votecallback = votecallback;

	this.statusTextDom = this.container.appendChild(document.createElement("span"));
	this.votingForTextDom = this.container.appendChild(document.createElement("span"));
	this.pollTimeDom = this.createPollTimeDom(container);
	votetext = this.container.appendChild(document.createElement("span"));
	votetext.innerHTML = "<h2>Vote for one of the following options:</h2>";
	this.voteOptionsDom = container.appendChild(document.createElement("div"));


	this.inputContainerDom = this.container.appendChild(document.createElement("div"));
	this.inputContainerDom.classList.add("inputcontainer-poll");
	this.inputContainerDom.style.display = "none";

	this.input = this.inputContainerDom.appendChild(document.createElement("input"));
	this.input.placeholder = "Type here...";
	this.input.addEventListener("keypress", function (event) {
		if (event.keyCode == 13) {
			this.voteinput();
		}
	}.bind(this));

	this.input.addEventListener("keydown", function (event) {
		if (event.keyCode == 9) {
			var position = typeof this.input.selectionStart == "number" ? this.input.selectionStart : this.input.value.length;
			this.input.value = this.input.value.slice(0, position) + "    " + this.input.value.slice(position, this.input.value.length);
			if (typeof this.input.setSelectionRange == "function") {
				this.input.setSelectionRange(position + 4, position + 4);
			}
			event.preventDefault();
		}
	}.bind(this));

	button = this.inputContainerDom.appendChild(document.createElement("div"));
	button.classList.add("button-small");
	button.classList.add("voteoption");
	button.appendChild(document.createTextNode("Vote!"));
	button.addEventListener("click", this.voteinput.bind(this));
	
	requestAnimationFrame(this.update.bind(this));
}

Poll.prototype.update = function update () {
	this.pollTimeDom.style.width = Math.max((this.timeTillNextVote - Date.now()) / this.timebetween, 0) * 100 + "%";
	this.pollTimeDom.innerHTML = Math.max(Math.round((this.timeTillNextVote - Date.now()) / 1000), 0) + " seconds left.";
	document.title = Math.max(Math.round((this.timeTillNextVote - Date.now()) / 1000), 0) + " seconds left. DemPro"
	if (this.stopped) return;
	setTimeout(this.update.bind(this), 200);
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
	this.input.value = "";
};

Poll.prototype.vote = function vote (option) {
	this.votecallback(option);
};

Poll.prototype.voted = function voted (option, votes, timeleft) {
	this.timeTillNextVote = Date.now() + timeleft;

	for (var k = 0; k < this.voteOptionsDom.children.length; k++) {
		var optionDom = this.voteOptionsDom.children[k];
		if (optionDom.voteOption == option) {
			if (votes == 0 && !this.setFromList) {
				this.voteOptionsDom.removeChild(optionDom);
				return
			}
			while(optionDom.firstChild) {
				optionDom.removeChild(optionDom.firstChild);
			}
			optionDom.appendChild(document.createTextNode(option + " (" + votes + ")"));
			return;
		}
	}

	this.addVoteOption(this.voteOptionsDom, option, votes);
};

Poll.prototype.addVoteOption = function addVoteOption (container, option, votes) {
	var optionDom = container.appendChild(document.createElement("pre"));
	optionDom.classList.add("voteoption");
	optionDom.appendChild(document.createTextNode(option + " (" + votes + ")"));
	optionDom.voteOption = option;
	optionDom.addEventListener("click", this.vote.bind(this, option));
};

Poll.prototype.setVoteOptionsFromList = function setVoteOptionsFromList (options) {
	while (this.voteOptionsDom.firstChild) {
		this.voteOptionsDom.removeChild(this.voteOptionsDom.firstChild);
	}

	for (var k = 0; k < options.options.length; k++) {
		this.addVoteOption(this.voteOptionsDom, options.options[k], options.currently_voted[options.options[k]] || 0);
	}

	this.votingForTextDom.innerHTML = "<h2>Currently voting on a command to run.</h2>";
	this.inputContainerDom.style.display = "none";
	this.setFromList = true;
};

Poll.prototype.setVoteOptionsFromVotes = function setVoteOptionsFromVotes (options) {
	while (this.voteOptionsDom.firstChild) {
		this.voteOptionsDom.removeChild(this.voteOptionsDom.firstChild);
	}

	for (var k in options.currently_voted) {
		this.addVoteOption(this.voteOptionsDom, k, options.currently_voted[k]);
	}

	this.votingForTextDom.innerHTML = "<h2>Currently voting on: " + options.parameter + "</h2>";
	this.inputContainerDom.style.display = "";
	this.setFromList = false;
};

Poll.prototype.setVoteData = function setVoteData (data) {
	this.timeTillNextVote = Date.now() + data.timeTillNextVote;
	if (data.options && data.options.options) {
		this.setVoteOptionsFromList(data.options);
	} else {
		this.setVoteOptionsFromVotes(data.options);
	}
	this.statusTextDom.innerHTML = "";
	this.input.value = "";
};
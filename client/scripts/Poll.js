function Poll (timebetween, container) {
	this.timebetween = timebetween;
	this.timeTillNextVote = 0;
	this.pollTimeDom = this.createPollTimeDom(container);
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

Poll.prototype.setVoteData = function setVoteData (data) {
	this.timeTillNextVote = Date.now() + data.timeTillNextVote;
};
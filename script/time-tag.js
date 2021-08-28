class TimeTag {
	constructor(hours, minutes, seconds) {
		this.time = { hours, minutes, seconds };
		this.timeSec = hours * 60 * 60 + minutes * 60 + seconds;
	}

	toString() {
		const time = this.time;
		return `${time.hours}:${time.minutes}:${time.seconds}`;
	}

	static fromSeconds(sec) {
		const hours = Math.floor(Math.floor(sec / 60) / 60);
		const minutes = Math.floor(sec / 60) % 60;
		const seconds = sec % 60;
		return new TimeTag(hours, minutes, seconds);
	}

	static parse(timeStr) {
		let [hours, minutes, seconds] = [0, 0, 0];
		const split = timeStr.split(':').map((v) => parseInt(v));
		switch (split.length) {
			case 2:
				[minutes, seconds] = split;
				break;
			case 3:
				[hours, minutes, seconds] = split;
				break;
			default:
				break;
		}
		const timeSec = hours * 60 * 60 + minutes * 60 + seconds;

		if (timeSec && timeSec > 0) return new TimeTag(hours, minutes, seconds);

		return null;
	}
}

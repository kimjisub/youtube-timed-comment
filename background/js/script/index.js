function toHistogram(data, { size, min, max }) {
	let cmin = Infinity;
	let cmax = -Infinity;

	for (const item of data) {
		if (item < cmin) cmin = item;
		else if (item > cmax) cmax = item;
	}

	min = min != undefined ? min : cmin;
	max = max != undefined ? max : cmax;

	const histoSize = Math.ceil((max - min + 1) / size);

	const res = new Array(histoSize).fill(0);

	for (const item of data) {
		const index = Math.floor((item - min) / size);
		if (0 <= index && index < res.length) res[index]++;
	}

	return { data: res, info: { min, max } };
}

function applyAmbientWeights(list, around) {
	const size = list.length;
	const ret = new Array(size).fill(0);
	for (let i = 0; i < size; i++) {
		let sum = 0;
		let count = 0;
		const start = Math.max(0, i - around);
		const end = Math.min(size - 1, i + around);
		for (let j = start; j <= end; j++) {
			const diff = Math.abs(i - j);
			const diffRatio = diff / around || 0;
			const weight = 1 - diffRatio ** 2;
			if (list[j] > 0) {
				sum += weight * list[j];
				count++;
			}
		}

		ret[i] = sum;
	}
	return ret;
}

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

class YoutubeApp {
	constructor(url) {
		this.log('init');
		this.url = url;
		this.videoId = new URLSearchParams(new URL(this.url).search).get('v');
		this.comments = [];
		this.video = document.querySelector('.html5-main-video');
		this.active = true;

		this.initChart();
		this.startGetComment();
	}

	destroy() {
		this.active = false;

		this.chart.destroy();
	}

	sendMessage(msg) {
		this.log('sendMessage', msg);
		chrome.runtime.sendMessage(extensionId, msg);
	}

	startGetComment(continuation) {
		if (!this.active) return;
		const payload = {
			videoId: this.videoId,
			sortByNewest: false,
			continuation,
			mustSetCookie: false,
		};

		ytcm
			.getComments(payload)
			.then((res) => {
				res.comments.forEach((comment) => {
					const timeTags = [];
					const timeTagStrs = comment.text.match(/[\d:]+/g) || [];
					timeTagStrs.forEach((timeTagStr) => {
						const timeTag = TimeTag.parse(timeTagStr);
						if (timeTag) {
							timeTags.push(timeTag);
						}
					});
					comment.timeTags = timeTags;

					this.comments.push(comment);
				});
				this.log(
					this.comments.length,
					this.comments.filter((comment) => comment.timeTags.length > 0).length
				);
				this.updateChart();

				if (res.continuation) this.startGetComment(res.continuation);
				else this.log('comment end~!');
			})
			.catch((error) => {
				this.log(error);
			});
	}

	initChart() {
		this.log('init chart');
		this.canvas = document.createElement('canvas');
		this.canvas.style =
			'width:100%;height:100px;bottom:-1px;position:absolute;';
		document
			.querySelector(
				'#movie_player > div.ytp-chrome-bottom > div.ytp-progress-bar-container > div.ytp-progress-bar'
			)
			.append(this.canvas);

		const options = {
			animation: true,
			responsive: false,
			maintainAspectRatio: false,
			bezierCurve: true,
			layout: {
				padding: 0,
			},
			scale: {
				ticks: {
					display: false,
					maxTicksLimit: 0,
				},
			},
			scales: {
				xAxis: {
					display: false,
				},
				yAxis: {
					display: false,
				},
			},
			interaction: {
				intersect: true,
				axis: 'xy',
				mode: 'index',
			},
			plugins: {
				legend: {
					display: false,
				},
				tooltip: {
					//enabled: false
				},
			},
		};
		const data = {
			labels: new Array(Math.ceil(this.video.duration))
				.fill()
				.map((v, i) => TimeTag.fromSeconds(i).toString()),
			datasets: [
				{
					label: '댓글 개수',
					backgroundColor: 'rgb(0, 99, 132, 0.5)',
					borderColor: 'rgb(0, 99, 132, 0.5)',
					fill: true,
					showLine: false,
					tension: 0.2,
					pointBackgroundColor: 'rgba(0, 0, 0, 0)',
					pointBorderColor: 'rgba(0, 0, 0, 0)',
					data: [],
					type: 'bar',
				},
				{
					label: '댓글 밀도',
					backgroundColor: 'rgb(255, 255, 255, 0.5)',
					borderColor: 'rgb(255, 255, 255, 0.5)',
					fill: true,
					showLine: false,
					pointBackgroundColor: 'rgba(0, 0, 0, 0)',
					pointBorderColor: 'rgba(0, 0, 0, 0)',
					data: [],
				},
			],
		};
		this.chart = new Chart(this.canvas, {
			type: 'line',
			data,
			options,
		});
	}

	updateChart() {
		const rawData = this.comments
			.filter((comment) => comment.timeTags.length > 0)
			.map((v) => v.timeTags[0].timeSec);
		const histo = toHistogram(rawData, {
			size: 1,
			min: 0,
			max: Math.ceil(this.video.duration),
		});
		const ambientHisto = applyAmbientWeights(histo.data, 3);
		//console.log('rawData', rawData);
		//console.log('histo', histo);
		//console.log('ambientHisto', ambientHisto);

		this.chart.data.datasets[0].data = histo.data;
		this.chart.data.datasets[1].data = ambientHisto;
		this.chart.update();
	}

	getVideoView() {
		return document.querySelector('.html5-main-video');
	}

	log(...msg) {
		console.log('YTC', ...msg);
	}
}

if (typeof youtubeApp != 'undefined') youtubeApp.destroy();
youtubeApp = new YoutubeApp(location.href);

onMessage = (event) => {
	this.log('onMessage', event.data);
};

class YoutubeApp {
	constructor(url) {
		this.url = url;
		this.videoId = new URLSearchParams(new URL(this.url).search).get('v');
		this.comments = [];
		this.video = this.getVideoView();
		this.isDestroyed = false;
		this.isActive = false;
		this.log('init', this.videoId);

		this.tryActiveInterval = setInterval(() => {
			if (this.tryActive()) this.active();
		}, 1000);
	}

	tryActive() {
		if (this.isDestroyed) return;
		if (this.isActive) return;

		return this.video.duration > 0;
	}

	active() {
		if (this.isDestroyed) return;
		if (this.isActive) return;

		this.log('active', this.videoId);

		clearInterval(this.tryActiveInterval);

		this.isActive = true;

		this.initChart();
		this.startGetComment();
	}

	destroy() {
		if (this.isDestroyed) return;
		this.log('destroy', this.videoId);

		this.isDestroyed = true;
		this.isActive = false;
		this.chart?.destroy();
	}

	startGetComment(continuation) {
		if (this.isDestroyed) return;
		if (!this.isActive) return;

		const payload = {
			videoId: this.videoId,
			sortByNewest: false,
			continuation,
			mustSetCookie: false,
		};

		ytcm
			.getComments(payload)
			.then((res) => {
				if (!this.isActive) return;

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

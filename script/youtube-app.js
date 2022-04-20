class YoutubeApp {
	/** YoutubeApp 생명주기
	 *
	 * constructor(location.href, document.querySelector('.html5-main-video'))
	 *
	 * onCreate()						처음 로딩이 되었을 때
	 * onActive()						비디오가 로딩이 됐을 때
	 * onDestroy()						다른 창으로 이동되어 영상과의 연결이 끊겼을 때
	 * onNewCommentLoaded(newComments)		댓글 업데이트가 되었을 때
	 * onCommentLoadEnd(comments)			댓글 불러오기가 끝났을 때
	 */
	constructor(url, video) {
		this.url = url;
		this.video = video;

		this.onCreate();
	}

	onCreate() {
		this.videoId = new URLSearchParams(new URL(this.url).search).get('v');
		this.comments = [];
		this.isDestroyed = false;
		this.isActive = false;

		this.tryActiveInterval = setInterval(() => {
			if (this.tryActive()) this.onActive();
		}, 1000);
	}

	onActive() {
		if (this.isDestroyed) return;
		if (this.isActive) return;

		clearInterval(this.tryActiveInterval);

		this.isActive = true;

		this.nextComments();
	}

	onDestroy() {
		if (this.isDestroyed) return;

		this.isDestroyed = true;
		this.isActive = false;
	}

	onNewCommentLoaded(comments, newComments) {}
	onCommentLoadEnd(comments) {}

	destroy() {
		this.onDestroy();
	}

	// Check is video loaded
	tryActive() {
		if (this.isDestroyed) return false;
		if (this.isActive) return false;

		return this.video.duration > 0;
	}

	nextComments(continuation) {
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

				const newComments = [];

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

					newComments.push(comment);
					this.comments.push(comment);
				});
				this.onNewCommentLoaded(this.comments, newComments);

				if (res.continuation) this.nextComments(res.continuation);
				else this.onCommentLoadEnd(this.comments);
			})
			.catch((error) => {});
	}

	log(...msg) {
		console.log('YTC', ...msg);
	}
}

class MyYoutubeApp extends YoutubeApp {
	constructor(url, video) {
		super(url, video);
	}
	onCreate() {
		super.onCreate();
		this.log('onCreate');
	}
	onActive() {
		super.onActive();
		this.log('onActive');
		this.initPadding();
		this.initComment();
		this.initChart();
	}
	onDestroy() {
		super.onDestroy();
		this.log('onDestroy');
		this.chart?.destroy();
	}
	onNewCommentLoaded(comments, newComments) {
		super.onNewCommentLoaded(comments, newComments);
		this.log('onNewCommentLoaded', comments, newComments);
		this.comments = comments;
		this.commentDiv.innerHTML = this.comments
			.filter((comment) => comment.timeTags.length > 0)
			.map((comment) => comment.text)
			.join('<br/>');
		this.updateChart();
	}
	onCommentLoadEnd(comments) {
		super.onCommentLoadEnd(comments);
		this.log('onCommentLoadEnd', comments);
	}

	initPadding() {
		// document.querySelector('#player-theater-container').style.paddingBottom = '50px';
	}

	initComment() {
		this.comments = [];
		this.commentDiv = document.createElement('yt-formatted-string');
		this.commentDiv.setAttribute(
			'class',
			'content style-scope ytd-video-secondary-info-renderer'
		);
		this.commentDiv.setAttribute('force-default-style', '');
		this.commentDiv.setAttribute('split-lines', '');
		const target = document.querySelector('#related');
		target.insertBefore(this.commentDiv, target.firstChild);
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
					enabled: false,
				},
			},
		};
		const data = {
			labels: new Array(Math.ceil(this.video.duration))
				.fill()
				.map((v, i) => TimeTag.fromSeconds(i).toString()),
			datasets: [
				{
					type: 'bar',
					label: '댓글 개수',
					backgroundColor: 'rgb(0, 99, 132, 0.5)',
					borderColor: 'rgb(0, 99, 132, 0.5)',
					fill: true,
					showLine: false,
					tension: 0.2,
					pointBackgroundColor: 'rgba(0, 0, 0, 0)',
					pointBorderColor: 'rgba(0, 0, 0, 0)',
					data: [],
				},
				{
					type: 'line',
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
}

console.log('Youtube App Loaded');

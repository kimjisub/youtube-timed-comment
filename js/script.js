class YoutubeApp {
	constructor(url){
		this.log('init')
		this.url = url;
		this.videoId = new URLSearchParams(new URL(this.url).search).get('v');
		this.comments = []

		// onMessage = (event) => {
		// 	this.log('onMessage', event.data);
		// }
		this.startGetComment()
	}

	sendMessage(msg){
		this.log('sendMessage', msg);
		chrome.runtime.sendMessage(extensionId, msg)
	}

	startGetComment(continuation) {
		const payload = {
			videoId: this.videoId,
			sortByNewest: false,
			continuation,
			mustSetCookie: false,
		};

		ytcm
			.getComments(payload)
			.then((data) => {

				data.comments.forEach(value => {
					const timeTagString = (value.text.match(/\d+:\d{1,2}/g) || [])[0]
					if(timeTagString){
						const [minutes, seconds] = timeTagString.split(':').map(v => parseInt(v))
						value.timeTag = { minutes, seconds }
					}
						
					this.comments.push(value)

				})
				this.log(this.comments.length, this.comments.filter(comment => comment.timeTag))
				
				if(data.continuation)
					this.startGetComment(data.continuation)
				else
					this.log('comment end~!')

			})
			.catch((error) => {
				this.log(error);
			});
	}

	getVideoView() {
		return document.querySelector('.html5-main-video')
	}

	log(...msg){
		console.log('YTC', ...msg)
	}
}

window.YoutubeApp = new YoutubeApp(location.href);



function main() {
	if (document.location.href.includes('youtube.com')) {
		let videoView = getVideoView()
		if (videoView) {
			videoView.addEventListener('play', onPlayed)
			videoView.addEventListener('pause', onPaused)
		}

		if (videoView.paused) paused()
		else played()
	}

	window.addEventListener('message', onMessage)
}

function changeVideo(data) {
	console.log('changeVideo', data)
	if (data) {
		let videoView = getVideoView()
		if (videoView) {
			if (data.playing) {
				let delayTime = (new Date().getTime() + timeOffset - data.startAt) / 1000
				play(delayTime + data.currentTime)
			} else pause(data.currentTime)
		}
	}
}

function detatch() {
	console.log('detatch')
	let videoView = getVideoView()
	videoView.removeEventListener('play', onPlayed)
	videoView.removeEventListener('pause', onPaused)
	window.removeEventListener('message', onMessage)
}

function disableAutoPlay() {
	if (document.getElementById('toggle').attributes['aria-pressed'].value == 'true') document.getElementById('toggle').click()
}

function played() {
	let videoView = getVideoView()
	console.log('Video Played', videoView.currentTime)
	chrome.runtime.sendMessage(extensionId, {
		videoChanged: {
			playing: true,
			currentTime: videoView.currentTime,
			startAt: new Date().getTime() + timeOffset
		}
	})
}

function paused() {
	let videoView = getVideoView()
	console.log('Video Paused', videoView.currentTime)
	chrome.runtime.sendMessage(extensionId, {
		videoChanged: {
			playing: false,
			currentTime: videoView.currentTime,
			startAt: 0
		}
	})
}

function play(currentTime) {
	let videoView = getVideoView()
	console.log('Play Video', currentTime)
	videoView.currentTime = currentTime
	videoView.play()
}

function pause(currentTime) {
	let videoView = getVideoView()
	console.log('Pause Video', currentTime)
	videoView.currentTime = currentTime
	videoView.pause()
}

function getVideoView() {
	return document.querySelector('.html5-main-video')
}

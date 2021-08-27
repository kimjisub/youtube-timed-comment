

function histogram(data, size) {
    let min = Infinity;
    let max = -Infinity;

    for (const item of data) {
        if (item < min) min = item;
        else if (item > max) max = item;
    }

    const bins = Math.ceil((max - min + 1) / size);

    const histogram = new Array(bins).fill(0);

    for (const item of data) {
        histogram[Math.floor((item - min) / size)]++;
    }

    return histogram;
}

class TimeTag {
	constructor(hours, minutes, seconds){
		this.time = {hours, minutes, seconds}
		this.timeSec = hours*60*60 + minutes*60 + seconds
	}

	static parse(timeStr){
		let [hours, minutes, seconds] = [0,0,0]
		const split = timeStr.split(':').map(v => parseInt(v))
		switch (split.length) {
			case 2:
				[minutes, seconds] = split
				break;
			case 3:
				[hours, minutes, seconds] = split
				break;
			default:
				break
		}
		const timeSec = hours*60*60 + minutes*60 + seconds

		if(timeSec && timeSec > 0)
			return new TimeTag(hours, minutes, seconds)

		return null
	}
}

class YoutubeApp {
	constructor(url){
		this.log('init')
		this.url = url;
		this.videoId = new URLSearchParams(new URL(this.url).search).get('v');
		this.comments = []

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
			.then((res) => {

				res.comments.forEach(comment => {
					const timeTags = []
					const timeTagStrs = comment.text.match(/[\d:]+/g) || []
					timeTagStrs.forEach(timeTagStr => {
						const timeTag = TimeTag.parse(timeTagStr)
						if(timeTag){
							timeTags.push(timeTag)
						}
					})
					comment.timeTags = timeTags
					
					this.comments.push(comment)

				})
				this.log(this.comments.length, 
					this.comments
						.filter(comment => comment.timeTags.length > 0)
						//.map(v => v.timeTags[0].timeSec)
					)
				
				if(res.continuation)
					this.startGetComment(res.continuation)
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


onMessage = (event) => {
	this.log('onMessage', event.data);
}


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

class YoutubeApi {
	constructor(tab) {
		this.tab = tab;
		this.url = tab.url;
		this.videoId = new URLSearchParams(new URL(this.url).search).get('v');
		this.active = false
        this.log('New Youtube', this.url);

        this.loadApp(()=>{
            this.active = true
        })
	}

	destructor() {
		this.log('Close Youtube', this.url);
	}

	loadApp(callback) {
        this.loadScript({
            code: `extensionId = '${chrome.runtime.id}'`,
        }, () => {
            this.loadScript({file: `background/js/script/yt-comment-scraper.js`}, ()=>{
                this.loadScript({file: `background/js/script/index.js`}, callback)
            })
        })
	}

    loadScript(script, callback) {
        chrome.tabs.executeScript(
            this.tab.id,
            script,
            callback
        );
    }

	scriptLoaded(tab) {
		this.log('scriptLoaded');
		fbApi.get(ytState[tab.id], (data) => {
			if (!ytState[tab.id].host) {
				this.changeVideo(tab, data.video);
			}
		});
	}
	urlChanged(tab, url, callback) {
		if (ytState[tab.id].host) {
			this.log('urlChanged', url);
			if (url.includes('youtube.com')) {
				fbApi.update(ytState[tab.id], {
					url,
				});
				this.loadScript(tab, () => {
					callback();
				});
			}
		}
	}
	videoChanged(tab, changed) {
		if (ytState[tab.id].host) {
			this.log('videoChanged', changed);
			if (ytState[tab.id]) fbApi.update(ytState[tab.id], { video: changed });
		}
	}
	changeWithData(tab, curr, prev) {
		this.log('changeWithData', curr, prev);
		if (prev == undefined || curr.url != prev.url)
			this.changeUrl(tab, curr.url);
		if (
			prev == undefined ||
			JSON.stringify(curr.video) != JSON.stringify(prev.video)
		)
			this.changeVideo(tab, curr.video);
	}
	changeUrl(tab, url) {
		this.log('changeUrl', url);
		chrome.tabs.update(tab.id, { url });
	}
	changeVideo(tab, data) {
		this.log('changeVideo', data);
		this.sendMessage(tab, { changeVideo: data });
		//window.postMessage({ changeVideo: data }, '*')
		//chrome.tabs.sendMessage(tab.id, { changeVideo: data })
	}
	sendMessage(tab, data) {
		chrome.tabs.executeScript(tab.id, {
			code: `window.postMessage(${JSON.stringify(data)}, '*')`,
		});
	}

	log(...messages) {
		console.log(this.tab.id, ...messages);
	}
}

class YoutubeApi {
	constructor(tab){
		this.tab = tab
		this.url = tab.url
		this.log('New Youtube', this.url)
	}
    destructor(){
		this.log('Close Youtube', this.url)
    }

	loadScript(tab, callback){
		console.log(tab.id, 'loadScript')
		chrome.tabs.executeScript(
			tab.id,
			{
				code: `extensionId = '${chrome.runtime.id}'`
			},
			() => {
				chrome.tabs.executeScript(
					tab.id,
					{
						file: `js/script.js`
					},
					() => {
						callback()
					}
				)
			}
		)
	}

	scriptLoaded(tab) {
		console.log(tab.id, 'scriptLoaded')
		fbApi.get(ytState[tab.id], data => {
			if (!ytState[tab.id].host) {
				this.changeVideo(tab, data.video)
			}
		})
	}
	urlChanged(tab, url, callback) {
		if (ytState[tab.id].host) {
			console.log(tab.id, 'urlChanged', url)
			if (url.includes('youtube.com')) {
				fbApi.update(ytState[tab.id], {
					url
				})
				this.loadScript(tab, () => {
					callback()
				})
			}
		}
	}
	videoChanged(tab, changed) {
		if (ytState[tab.id].host) {
			console.log(tab.id, 'videoChanged', changed)
			if (ytState[tab.id]) fbApi.update(ytState[tab.id], { video: changed })
		}
	}
	changeWithData(tab, curr, prev) {
		console.log(tab.id, 'changeWithData', curr, prev)
		if (prev == undefined || curr.url != prev.url) this.changeUrl(tab, curr.url)
		if (prev == undefined || JSON.stringify(curr.video) != JSON.stringify(prev.video)) this.changeVideo(tab, curr.video)
	}
	changeUrl(tab, url) {
		console.log(tab.id, 'changeUrl', url)
		chrome.tabs.update(tab.id, { url })
	}
	changeVideo(tab, data) {
		console.log(tab.id, 'changeVideo', data)
		this.sendMessage(tab, { changeVideo: data })
		//window.postMessage({ changeVideo: data }, '*')
		//chrome.tabs.sendMessage(tab.id, { changeVideo: data })
	}
	sendMessage(tab, data) {
		chrome.tabs.executeScript(tab.id, {
			code: `window.postMessage(${JSON.stringify(data)}, '*')`
		})
	}

    log(...messages){
        console.log(this.tab.id, ...messages)
    }
}
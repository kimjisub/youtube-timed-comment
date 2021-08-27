class YoutubeApi {
	constructor(tab) {
		this.tab = tab;
		this.url = tab.url;
		this.videoId = new URLSearchParams(new URL(this.url).search).get('v');
		this.active = false;
		this.log('New Youtube', this.url);

		this.loadApp(() => {
			this.active = true;
		});
	}

	destructor() {
		this.log('Close Youtube', this.url);
	}

	loadApp(callback) {
		this.loadScript(
			{
				code: `extensionId = '${chrome.runtime.id}'`,
			},
			() => {
				this.loadScript(
					{ file: `background/js/script/yt-comment-scraper.js` },
					() => {
						this.loadScript({ file: `background/js/script/chart.js` }, () => {
							this.loadScript(
								{ file: `background/js/script/index.js` },
								callback
							);
						});
					}
				);
			}
		);
	}

	loadScript(script, callback) {
		chrome.tabs.executeScript(this.tab.id, script, callback);
	}

	sendMessage(data) {
		chrome.tabs.executeScript(this.tab.id, {
			code: `window.postMessage(${JSON.stringify(data)}, '*')`,
		});
	}

	log(...messages) {
		console.log(this.videoId, ...messages);
	}
}

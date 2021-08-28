class YoutubeApi {
	constructor(tab) {
		this.tab = tab;
		this.url = tab.url;
		this.videoId = new URLSearchParams(new URL(this.url).search).get('v');
		this.active = false;
		this.log('New Youtube', this.url);

		this.loadApp().then((res) => {
			this.active = true;
		});
	}

	destructor() {
		this.log('Close Youtube', this.url);
	}

	async loadApp() {
		return new Promise((resolve, reject) => {
			this.loadScript({
				code: `
				alreadyLoaded = typeof extensionId == 'string';
				extensionId = '${chrome.runtime.id}';
				alreadyLoaded`,
			})
				.then(async (res) => {
					const alreadyLoaded = res[0];
					this.log('alreadyLoaded', alreadyLoaded);
					if (!alreadyLoaded)
						this.log(
							await Promise.all([
								this.loadScript({ file: `script/lib/yt-comment-scraper.js` }),
								this.loadScript({ file: `script/lib/chart.js` }),
								this.loadScript({ file: `script/chart-math.js` }),
								this.loadScript({ file: `script/time-tag.js` }),
								this.loadScript({ file: `script/youtube-app.js` }),
							])
						);
					this.loadScript({ file: `script/index.js` })
						.then(resolve)
						.catch(reject);
				})
				.catch(reject);
		});
	}

	async loadScript(script) {
		return new Promise((resolve, reject) => {
			chrome.tabs.executeScript(this.tab.id, script, resolve);
		});
	}

	log(...messages) {
		console.log(this.videoId, ...messages);
	}
}

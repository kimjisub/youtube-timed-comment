const youtubes = {};

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
				func: () => {
					alreadyLoaded = typeof extensionId == 'string';
					extensionId = '${chrome.runtime.id}';
					return alreadyLoaded;
				},
			})
				.then(async (res) => {
					const alreadyLoaded = res[0].result;
					this.log('alreadyLoaded', alreadyLoaded);
					if (!alreadyLoaded) {
						await this.loadScript({
							files: [
								`script/lib/yt-comment-scraper.js`,
								`script/lib/chart.js`,
								`script/chart-math.js`,
								`script/time-tag.js`,
								`script/youtube-app.js`,
								`script/initalize.js`,
							],
						});
					}
					this.loadScript({ files: [`script/index.js`] })
						.then(resolve)
						.catch(reject);
				})
				.catch(reject);
		});
	}

	async loadScript(script) {
		return new Promise((resolve, reject) => {
			chrome.scripting.executeScript(
				{ target: { tabId: this.tab.id }, ...script },
				resolve
			);
			// chrome.tabs.executeScript(this.tab.id, script, resolve);
		});
	}

	log(...messages) {
		console.log(this.videoId, ...messages);
	}
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url.includes('youtube.com/watch'))
		if (changeInfo.status == 'complete') {
			console.log(tabId, changeInfo);
			youtubes[tabId]?.destructor();
			youtubes[tabId] = new YoutubeApi(tab);
			return;
		}
});

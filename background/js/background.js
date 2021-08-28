const youtubes = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url.includes('youtube.com/watch'))
		if (changeInfo.status == 'complete') {
			console.log(tabId, changeInfo);
			youtubes[tabId]?.destructor();
			youtubes[tabId] = new YoutubeApi(tab);
			return;
		}
});

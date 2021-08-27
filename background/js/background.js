const youtubes = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url.includes('youtube.com/watch'))
		if (changeInfo.status == 'complete') {
			console.log(tabId, changeInfo);
			youtubes[tabId]?.destructor();
			youtubes[tabId] = new YoutubeApi(tab);
			return;
		}

	//console.log(tabId, 'tab changed', changeInfo)
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.videoChanged)
		youtubeApi.videoChanged(sender.tab, request.videoChanged);
	if (request.scriptLoaded) youtubeApi.scriptLoaded(sender.tab);
});

//window.youtubeApi = youtubeApi

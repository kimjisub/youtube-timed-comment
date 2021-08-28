if (typeof youtubeApp != 'undefined') {
	youtubeApp.destroy();
	youtubeApp = undefined;
}
youtubeApp = new YoutubeApp(location.href);

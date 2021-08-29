if (typeof youtubeApp != 'undefined') {
	youtubeApp.destroy();
	youtubeApp = undefined;
}
youtubeApp = new MyYoutubeApp(
	location.href,
	document.querySelector('.html5-main-video')
);

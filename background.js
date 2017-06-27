chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('index.html', {id:"fileWin", innerBounds: {width: 2000, height: 1500}}, function(win) {
    win.contentWindow.launchData = launchData;
  });
});

chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create('index.html', {id:"fileWin", outerBounds: {width: 1200, height: 950}}, function(win) {
    win.contentWindow.launchData = launchData;
  });
});

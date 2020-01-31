var puppeteer = require('puppeteer');

puppeteer.launch().then(function (browser) {
  browser.newPage().then(function (page) {
    page.addScriptTag({ path: require.resolve(process.argv[2]) }).then(function () {
      page.evaluate(function () {
        return new Promise(function (resolve) {
          window.onEnd = resolve;
        });
      }).then(function () {
        browser.close();
      });
    });
    page.on('console', function (message) {
      console.log(message.text());
    });
  });
});

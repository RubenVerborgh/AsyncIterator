# Asynchronous iterators for JavaScript
## Data streams that only generate what you need
JavaScript natively supports scenarios where functions return a single value,
multiple lazily and synchronously created values (through [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)),
or a single value created asynchronously (through [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)).
`AsyncIterator` allows functions to return
**_multiple_ values that are created _asynchronously_ and _lazily_**:


<table>
  <tr>
    <td>&nbsp;</td>
    <th>single value</th>
    <th>multiple values</th>
  </tr>
  <tr>
    <th>synchronous</th>
    <td><code>T getValue()</code></td>
    <td><code>Iterable&lt;T&gt; getValues()</code></td>
  </tr>
  <tr>
    <th>asynchronous</th>
    <td><code>Promise&lt;T&gt; getValue()</code></td>
    <td><strong><code>AsyncIterator&lt;T&gt; getValues()</code></strong></td>
  </tr>
</table>

Just like `Iterable`, **an `AsyncIterator` only generates items when you ask it to**.
This contrast with other patterns such as [`Observable`](http://reactivex.io/intro.html),
which are data-driven and don't wait for consumers to process items.

`AsyncIterator` is essentially a light-weight alternative to the two-way flow controlled [Node.js `Stream`](https://nodejs.org/api/stream.html).
As opposed to `Stream`, you cannot _push_ anything into an `AsyncIterator`;
instead, an iterator would _pull_ things from another iterator.
This eliminates the need for expensive, complex flow control.

## Example: fetching Wikipedia links related to natural numbers
In the example below, we create an iterator of links found on Wikipedia pages for natural numbers.
```JavaScript
var AsyncIterator = require('asynciterator');

// Iterate over the natural numbers
var numbers = new AsyncIterator.IntegerIterator({ start: 0, end: Infinity });
// Transform these numbers into Wikipedia URLs
var urls = numbers.map(function (number) {
  return 'https://en.wikipedia.org/wiki/' + number;
});
// Fetch each corresponding Wikipedia page
var pages = urls.transform(function (url, done) {
  require('https').get(url, function (response) {
    var page = '';
    response.on('data', function (data) { page += data; });
    response.on('end',  function () { pages._push(page); done(); });
  });
});
// Extract the links from each page
var links = pages.transform(function (page, done) {
  var search = /href="([^"]+)"/g, match, resolve = require('url').resolve;
  while (match = search.exec(page))
    this._push(resolve('https://en.wikipedia.org/', match[1]));
  done();
});
```

We could display a link every 0.1 seconds:
```JavaScript
setInterval(function () {
  var link = links.read();
  if (link) console.log(link);
}, 100);
```

Or we can get the first 1000 links and display them:
```JavaScript
links.take(30).on('data', console.log);
```

In both cases, pages from Wikipedia will only be fetched when needed.
This is what makes `AsyncIterator` [_lazy_](https://en.wikipedia.org/wiki/Lazy_evaluation).

## License
The asynciterator library is copyrighted by [Ruben Verborgh](http://ruben.verborgh.org/)
and released under the [MIT License](http://opensource.org/licenses/MIT).

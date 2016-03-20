# Asynchronous iterators for JavaScript
## Data streams that only generate what you need
JavaScript natively supports scenarios where functions return a single value,
multiple synchronously created values (through [`Iterable`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols)),
or a single value created asynchronously (through [`Promise`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)).
`AsyncIterator` fills the gap of scenarios where a function returns
**_multiple_ values that are created _asynchronously_**:


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

## License
The asynciterator library is copyrighted by [Ruben Verborgh](http://ruben.verborgh.org/)
and released under the [MIT License](http://opensource.org/licenses/MIT).

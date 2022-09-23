export function wrap<T>(source?: MaybePromise<IterableSource<T>> | null): AsyncIterator<T> {
// TransformIterator if TransformIteratorOptions were specified
if (options && ('autoStart' in options || 'optional' in options || 'source' in options || 'maxBufferSize' in options))
return new TransformIterator<T>(source as MaybePromise<AsyncIterator<T>>, options);

// Empty iterator if no source specified
if (!source)
return empty();

// Unwrap promised sources
if (isPromise<T>(source))
return new WrappingIterator(source, options);

// Directly return any AsyncIterator
if (source instanceof AsyncIterator)
return source;

// Other iterable objects
if (Array.isArray(source))
return fromArray<T>(source);
if (isIterable(source) || isIterator(source) || isEventEmitter(source))
return new WrappingIterator<T>(source, options);

// Other types are unsupported
throw new TypeError(`Invalid source: ${source}`);
}

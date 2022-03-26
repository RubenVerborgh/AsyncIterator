// import { AsyncIterator } from './asynciterator';

// interface Transform { filter: boolean, function: Function }[];

// function build(transforms: Transform[]) {
//   return transforms.reduceRight((f, transform) => {
//     return transform.filter ?
//       (item: any) => transform.function(item) ? f(item) : null :
//       (item: any) => transform.function(f(item))
//   }, (e: any) => e)
// }

// export class FastTransformIterator<T> extends AsyncIterator<T> {
//   private transforms: { filter: boolean, function: Function }[] = [];
//   constructor(private source: AsyncIterator<T>) {
//     super();
//     source.on('readable', () => {
//       this.emit('readable');
//     });
//     source.on('end', () => {
//       this.close();
//     });
//   }
//   read(): T | null {
//     const func = build(this.transforms);

//     const { source } = this

//     this.read = () => {
//       let item;
//       while ((item = source.read()) !== null) {
//         if ((item = func(item)) !== null)
//           return item;
//       }
//       return item;
//     }

//     return this.read();
//   }
//   filter(filter: (item: T) => boolean): AsyncIterator<T> {
//     this.transforms.push({ filter: true, function: filter });

//     if (process.env.NODE_ENV === 'development') {

//       const that = Object.assign({}, this);
//       for (const key in this) {
//         if (typeof this[key] === 'function') {
//           // @ts-ignore
//           this[key] = () => { throw new Error('You are trying to use methods on an iterator - which has been destroyed by another transform operation') };
//         } else {
//           delete this[key];
//         }
//       }
//       return that as unknown as AsyncIterator<T>;

//     }

//     return this as unknown as AsyncIterator<T>;
//   }
//   map<D>(map: (item: T) => D): AsyncIterator<D> {
//     this.transforms.push({ filter: false, function: map });

//     if (process.env.NODE_ENV === 'development') {

//       const that = Object.assign({}, this);
//       for (const key in this) {
//         if (typeof this[key] === 'function') {
//           // @ts-ignore
//           this[key] = () => { throw new Error('You are trying to use methods on an iterator - which has been destroyed by another transform operation') };
//         } else {
//           delete this[key];
//         }
//       }
//       return that as unknown as AsyncIterator<D>;

//     }

//     return this as unknown as AsyncIterator<D>;
//   }
//   syncTransform<D>(transform: (item: T) => Generator<D>): AsyncIterator<D> {
//     const { source } = this;

//     // Build the map-filter transformation pipeline between the current source and the use
//     // of this generator.
//     const func = build(this.transforms);
//     this.transforms = [];

//     let transformation: Generator<D> | null;

//     // Override the current source with a new source that applies the generator mapping
//     // @ts-ignore
//     this.source = {
//       read(): D | null {
//         let item: any;

//         while (true) {
//           // If we are not currently using a generator then get one
//           if (!transformation) {
//             // Get the first non-null upstream item
//             while ((item = source.read()) !== null) {
//               if ((item = func(item)) !== null)
//                 break;
//             }

//             // If we cannot get a non-null item from the
//             // source then return null
//             if (item === null)
//               return item;

//             // Otherwise create a new generator
//             transformation = transform(item);
//           }

//           if (!(item = transformation.next()).done)
//             return item.value;
//           else
//             transformation = null;
//         }
//       }
//     } as unknown as AsyncIterator<D>;

//     if (process.env.NODE_ENV === 'development') {

//       const that = Object.assign({}, this);
//       for (const key in this) {
//         if (typeof this[key] === 'function') {
//           // @ts-ignore
//           this[key] = () => { throw new Error('You are trying to use methods on an iterator - which has been destroyed by another transform operation') };
//         } else {
//           delete this[key];
//         }
//       }
//       return that as unknown as AsyncIterator<D>;

//     }

//     return this as unknown as AsyncIterator<D>;
//   }
// }

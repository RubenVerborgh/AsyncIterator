import { SynchronousTransformIterator } from "./SynchronousTransformIterator";
// import {} from "./AsyncIterator";

export class LazyCardinalityIterator<T> extends SynchronousTransformIterator<T> {

  // constructor() {
  //   super()
  // }

  safeRead() {
    this.source.read();
  }

  public getCardinality() {
    // Base on https://github.com/comunica/comunica/blob/b16e18888b0e93821c76e01a6efd9bcb3c4f9523/packages/actor-query-operation-sparql-endpoint/lib/LazyCardinalityIterator.ts
    // *but*
  }
}

import { EventEmitter } from "events";

// Determines whether the given object is a function
export function isFunction(object: any): object is Function {
  return typeof object === 'function';
}

// Determines whether the given object is an EventEmitter
export function isEventEmitter(object: any): object is EventEmitter {
  return isFunction(object?.on);
}

// Determines whether the given object is a promise
export function isPromise<T>(object: any): object is Promise<T> {
  return isFunction(object?.then);
}

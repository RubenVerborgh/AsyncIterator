import { EventEmitter } from "events";
import { DESTINATION } from "./symbols";

export interface AsyncIteratorBase<T> extends EventEmitter {
  _state: number;
  _readable: boolean;
  readable: boolean;
  _canEmitReadable: boolean;
  _flowing: boolean;
  _emitDataPendingOrRunning: boolean;
  _properties?: { [name: string]: any };
  _propertyCallbacks?: { [name: string]: [(value: any) => void] };
  [DESTINATION]?: AsyncIteratorBase<any>;
  onParentReadable?(): void;

  read(): T | null;
}

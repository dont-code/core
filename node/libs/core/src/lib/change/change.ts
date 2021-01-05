import { DontCodeModelPointer } from "../..";

export class Change {
  type: ChangeType;
  position: string;
  value: any;
  pointer?:DontCodeModelPointer;
  oldPosition: string;
  beforeKey: string;

  constructor(type: ChangeType, position: string, value: any, pointer?:DontCodeModelPointer, beforeKey?:string, oldPosition?:string) {
    this.type = type;
    this.position = position;
    this.value = value;
    this.pointer = pointer;
    this.beforeKey = beforeKey;
    this.oldPosition=oldPosition;
  }
}

export enum ChangeType {
  ADD='ADD' ,UPDATE='UPDATE', DELETE='DELETE', MOVE='MOVE', RESET='RESET'
}

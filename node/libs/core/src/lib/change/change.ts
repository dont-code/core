import { DontCodeModelPointer } from "../..";

export class Change {
  type: ChangeType;
  position: string;
  value: any;
  pointer?:DontCodeModelPointer;


  constructor(type: ChangeType, position: string, value: any, pointer?:DontCodeModelPointer) {
    this.type = type;
    this.position = position;
    this.value = value;
    this.pointer = pointer;
  }
}

export enum ChangeType {
  ADD='ADD' ,UPDATE='UPDATE', DELETE='DELETE', RESET='RESET'
}

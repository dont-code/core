export class Change {
  type: ChangeType;
  position: string;
  value: any;


  constructor(type: ChangeType, position: string, value: any) {
    this.type = type;
    this.position = position;
    this.value = value;
  }
}

export enum ChangeType {
  ADD='ADD' ,UPDATE='UPDATE', DELETE='DELETE', RESET='RESET'
}

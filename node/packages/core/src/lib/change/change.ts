import { DontCodeModelPointer } from '../model/dont-code-schema';

export class Change {
  type: ChangeType;
  position: string;
  value: any;
  pointer?: DontCodeModelPointer;
  oldPosition?: string;
  beforeKey?: string;

  constructor(
    type: ChangeType,
    position: string,
    value: any,
    pointer?: DontCodeModelPointer,
    beforeKey?: string,
    oldPosition?: string
  ) {
    this.type = type;
    this.position = position;
    if (position === '/')
      throw new Error(
        'Root position is defined by empty string and not slash anymore'
      );
    this.value = value;
    this.pointer = pointer;
    this.beforeKey = beforeKey;
    this.oldPosition = oldPosition;
  }

  /**
   * Utility method to return the position parent of this change by selecting the right way to calculate it
   * if the change is for the root (thus with no parent), it throws an exception.
   * Use this method if you are sure the Change is not for root.
   */
  getSafeParentPosition(): string {
    const parent = this.getParentPosition();
    if (parent == null) throw new Error('No Parent position for root changes.');
    return parent;
  }

  /**
   * Utility method to return the position parent of this change by selecting the right way to calculate it
   * if the change is for the root (thus with no parent), it returns null.
   * */
  getParentPosition(): string | null {
    if (this.pointer != null) {
      return this.pointer.containerPosition ?? null;
    } else {
      return DontCodeModelPointer.parentPosition(this.position);
    }
  }
}

export enum ChangeType {
  ADD = 'ADD',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  MOVE = 'MOVE',
  RESET = 'RESET',
  ACTION = 'ACTION'
}

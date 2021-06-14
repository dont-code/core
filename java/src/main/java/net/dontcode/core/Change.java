package net.dontcode.core;

/**
 * A change of configuration of an application done by the Builder
 */
public class Change {
    protected ChangeType type;
    protected String position;
    protected Object value;
    protected DontCodeModelPointer pointer;
    protected String oldPosition;
    protected String beforeKey;

    public static enum ChangeType {
        ADD ,UPDATE, DELETE, MOVE, RESET
    }

    public Change() {
    }

    public Change(ChangeType type, String position, Object value) {
        this.type = type;
        this.position = position;
        this.value = value;
    }

    public Change(ChangeType type, String position, Object value, DontCodeModelPointer pointer) {
        this.type = type;
        this.position = position;
        this.value = value;
        this.pointer = pointer;
    }

    public Change(ChangeType type, String position, Object value, DontCodeModelPointer pointer, String oldPosition, String beforeKey) {
        this.type = type;
        this.position = position;
        this.value = value;
        this.pointer = pointer;
        this.oldPosition = oldPosition;
        this.beforeKey = beforeKey;
    }

    public ChangeType getType() {
        return type;
    }

    public void setType(ChangeType type) {
        this.type = type;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public DontCodeModelPointer getPointer() {
        return pointer;
    }

    public void setPointer(DontCodeModelPointer pointer) {
        this.pointer = pointer;
    }

    public String getOldPosition() {
        return oldPosition;
    }

    public void setOldPosition(String oldPosition) {
        this.oldPosition = oldPosition;
    }

    public String getBeforeKey() {
        return beforeKey;
    }

    public void setBeforeKey(String beforeKey) {
        this.beforeKey = beforeKey;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Change)) return false;

        Change change = (Change) o;

        if (type != change.type) return false;
        if (!position.equals(change.position)) return false;
        if (value != null ? !value.equals(change.value) : change.value != null) return false;
        if (pointer != null ? !pointer.equals(change.pointer) : change.pointer != null) return false;
        if (oldPosition != null ? !oldPosition.equals(change.oldPosition) : change.oldPosition != null) return false;
        return beforeKey != null ? beforeKey.equals(change.beforeKey) : change.beforeKey == null;
    }

    @Override
    public int hashCode() {
        int result = type.hashCode();
        result = 31 * result + position.hashCode();
        result = 31 * result + (value != null ? value.hashCode() : 0);
        result = 31 * result + (pointer != null ? pointer.hashCode() : 0);
        result = 31 * result + (oldPosition != null ? oldPosition.hashCode() : 0);
        result = 31 * result + (beforeKey != null ? beforeKey.hashCode() : 0);
        return result;
    }
}

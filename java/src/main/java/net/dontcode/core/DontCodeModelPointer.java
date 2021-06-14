package net.dontcode.core;

/**
 * A pointer to an element in the application configuration
 */
public class DontCodeModelPointer {
    protected String position;

    protected String schemaPosition;

    protected String containerPosition;

    protected String containerSchemaPosition;

    protected String key;

    protected String itemId;

    public DontCodeModelPointer() {
    }

    public DontCodeModelPointer(String position, String schemaPosition, String containerPosition, String containerSchemaPosition) {
        this.position = position;
        this.schemaPosition = schemaPosition;
        this.containerPosition = containerPosition;
        this.containerSchemaPosition = containerSchemaPosition;
    }

    public DontCodeModelPointer(String position, String schemaPosition, String containerPosition, String containerSchemaPosition, String key, String itemId) {
        this.position = position;
        this.schemaPosition = schemaPosition;
        this.containerPosition = containerPosition;
        this.containerSchemaPosition = containerSchemaPosition;
        this.key = key;
        this.itemId = itemId;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getSchemaPosition() {
        return schemaPosition;
    }

    public void setSchemaPosition(String schemaPosition) {
        this.schemaPosition = schemaPosition;
    }

    public String getContainerPosition() {
        return containerPosition;
    }

    public void setContainerPosition(String containerPosition) {
        this.containerPosition = containerPosition;
    }

    public String getContainerSchemaPosition() {
        return containerSchemaPosition;
    }

    public void setContainerSchemaPosition(String containerSchemaPosition) {
        this.containerSchemaPosition = containerSchemaPosition;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getItemId() {
        return itemId;
    }

    public void setItemId(String itemId) {
        this.itemId = itemId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DontCodeModelPointer)) return false;

        DontCodeModelPointer that = (DontCodeModelPointer) o;

        if (position != null ? !position.equals(that.position) : that.position != null) return false;
        if (schemaPosition != null ? !schemaPosition.equals(that.schemaPosition) : that.schemaPosition != null)
            return false;
        if (containerPosition != null ? !containerPosition.equals(that.containerPosition) : that.containerPosition != null)
            return false;
        if (containerSchemaPosition != null ? !containerSchemaPosition.equals(that.containerSchemaPosition) : that.containerSchemaPosition != null)
            return false;
        if (key != null ? !key.equals(that.key) : that.key != null) return false;
        return itemId != null ? itemId.equals(that.itemId) : that.itemId == null;
    }

    @Override
    public int hashCode() {
        int result = position != null ? position.hashCode() : 0;
        result = 31 * result + (schemaPosition != null ? schemaPosition.hashCode() : 0);
        result = 31 * result + (containerPosition != null ? containerPosition.hashCode() : 0);
        result = 31 * result + (containerSchemaPosition != null ? containerSchemaPosition.hashCode() : 0);
        result = 31 * result + (key != null ? key.hashCode() : 0);
        result = 31 * result + (itemId != null ? itemId.hashCode() : 0);
        return result;
    }
}

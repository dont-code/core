package net.dontcode.core;

import java.util.Objects;

/**
 * A pointer to an element in the application configuration
 */
public class DontCodeModelPointer {
    protected String position;

    protected String positionInSchema;

    protected String containerPosition;

    protected String containerPositionInSchema;

    protected String lastElement;

    protected Boolean isProperty;
    public DontCodeModelPointer() {
    }

    public DontCodeModelPointer(String position, String positionInSchema, String containerPosition, String containerPositionInSchema) {
        this.position = position;
        this.positionInSchema = positionInSchema;
        this.containerPosition = containerPosition;
        this.containerPositionInSchema = containerPositionInSchema;
    }

    public DontCodeModelPointer(String position, String positionInSchema, String containerPosition, String containerPositionInSchema, String lastElement, Boolean isProperty) {
        this.position = position;
        this.positionInSchema = positionInSchema;
        this.containerPosition = containerPosition;
        this.containerPositionInSchema = containerPositionInSchema;
        this.lastElement = lastElement;
        this.isProperty = isProperty;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getPositionInSchema() {
        return positionInSchema;
    }

    public void setPositionInSchema(String positionInSchema) {
        this.positionInSchema = positionInSchema;
    }

    public String getContainerPosition() {
        return containerPosition;
    }

    public void setContainerPosition(String containerPosition) {
        this.containerPosition = containerPosition;
    }

    public String getContainerPositionInSchema() {
        return containerPositionInSchema;
    }

    public void setContainerPositionInSchema(String containerPositionInSchema) {
        this.containerPositionInSchema = containerPositionInSchema;
    }

    public String getLastElement() {
        return lastElement;
    }

    public void setLastElement(String lastElement) {
        this.lastElement = lastElement;
    }

    public Boolean getIsProperty () {
        return this.isProperty;
    }

    public void setIsProperty (Boolean isProperty) {
        this.isProperty = isProperty;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DontCodeModelPointer)) return false;

        DontCodeModelPointer that = (DontCodeModelPointer) o;

        if (!Objects.equals(position, that.position)) return false;
        if (!Objects.equals(positionInSchema, that.positionInSchema))
            return false;
        if (!Objects.equals(containerPosition, that.containerPosition))
            return false;
        if (!Objects.equals(containerPositionInSchema, that.containerPositionInSchema))
            return false;
        if (!Objects.equals( lastElement, that.lastElement))
            return false;
        return Objects.equals(isProperty, that.isProperty);
    }

    @Override
    public int hashCode() {
        int result = position != null ? position.hashCode() : 0;
        result = 31 * result + (positionInSchema != null ? positionInSchema.hashCode() : 0);
        result = 31 * result + (containerPosition != null ? containerPosition.hashCode() : 0);
        result = 31 * result + (containerPositionInSchema != null ? containerPositionInSchema.hashCode() : 0);
        result = 31 * result + (lastElement != null ? lastElement.hashCode() : 0);
        result = 31 * result + (isProperty != null ? isProperty.hashCode() : 0);
        return result;
    }
}

package net.dontcode.core.project;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DontCodeProjectWorkflowDataSortDirection {
    ascending ("ascending"),
    descending ("descending");

    private String value;

    DontCodeProjectWorkflowDataSortDirection(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}

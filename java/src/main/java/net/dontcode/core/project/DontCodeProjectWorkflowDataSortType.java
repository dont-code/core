package net.dontcode.core.project;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DontCodeProjectWorkflowDataSortType {
    field ("field");

    private String value;

    DontCodeProjectWorkflowDataSortType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}

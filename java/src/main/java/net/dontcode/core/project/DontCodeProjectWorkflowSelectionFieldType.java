package net.dontcode.core.project;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DontCodeProjectWorkflowSelectionFieldType {
    ClosestAfter ("closest-after"),
    ClosestBefore ("closest-before");

    private String value;

    DontCodeProjectWorkflowSelectionFieldType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }
}

package net.dontcode.core.project;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DontCodeProjectWorkflowType {
    ListDetail ("list-detail"),
    Carousel ("carousel");

    private String value;

    DontCodeProjectWorkflowType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

}

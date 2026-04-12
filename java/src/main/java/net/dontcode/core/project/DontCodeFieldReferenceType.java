package net.dontcode.core.project;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DontCodeFieldReferenceType {
    ManyToOne ("ManyToOne");

    private String value;

    DontCodeFieldReferenceType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    }

package net.dontcode.core.project;

import com.fasterxml.jackson.annotation.JsonValue;

public enum DontCodeFieldReferenceType {
    ManyToOne ("ManyToOne"),
    OneToMany ("OneToMany");

    private String value;

    DontCodeFieldReferenceType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    }

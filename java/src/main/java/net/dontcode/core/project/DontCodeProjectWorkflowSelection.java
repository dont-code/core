package net.dontcode.core.project;

import java.util.Optional;

public record DontCodeProjectWorkflowSelection(DontCodeProjectWorkflowSelectionField field) {
    Optional<DontCodeProjectWorkflowSelectionField> getOptionalField () {
        return Optional.ofNullable(field);
    }

}

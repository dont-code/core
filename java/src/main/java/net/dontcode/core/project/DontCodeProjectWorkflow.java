package net.dontcode.core.project;

import java.util.Optional;

public record DontCodeProjectWorkflow(String entity, DontCodeProjectWorkflowType workflow, DontCodeProjectWorkflowData data, DontCodeProjectWorkflowDisplay display, DontCodeProjectWorkflowSelection selection ) {
    Optional<DontCodeProjectWorkflowData> getOptionalData () {
        return Optional.ofNullable(data);
    }
    Optional<DontCodeProjectWorkflowDisplay> getOptionalDisplay () {
        return Optional.ofNullable(display);
    }
    Optional<DontCodeProjectWorkflowSelection> getOptionalSelection () {
        return Optional.ofNullable(selection);
    }
}

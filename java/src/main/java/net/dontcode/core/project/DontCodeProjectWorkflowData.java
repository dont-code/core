package net.dontcode.core.project;

import java.util.Map;
import java.util.Optional;

public record DontCodeProjectWorkflowData(Map<String, DontCodeProjectWorkflowDataSort> sort) {
    Optional<Map<String, DontCodeProjectWorkflowDataSort>> getOptionalSort () {
        return Optional.ofNullable(sort);
    }

}

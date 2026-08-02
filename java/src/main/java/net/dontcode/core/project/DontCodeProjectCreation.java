package net.dontcode.core.project;

import java.util.Map;
import java.util.Optional;

public record DontCodeProjectCreation(String name, DontCodeProjectCreationType type, DontCodeProjectEntity[] entities, Map<String, DontCodeProjectWorkflow> workflows) {

    Optional<Map<String, DontCodeProjectWorkflow>> getOptionalWorkflows () {
        return Optional.ofNullable(workflows);
    }

}

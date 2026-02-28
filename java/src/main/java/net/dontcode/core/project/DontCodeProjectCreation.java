package net.dontcode.core.project;

public record DontCodeProjectCreation(String name, DontCodeProjectCreationType type, DontCodeProjectEntities[] entities) {
}

package net.dontcode.core.project;

public record DontCodeProjectModel (
    String name,
    String description,
    DontCodeProjectContent content
) {

}


package net.dontcode.core.project;

public record DontCodeProjectModel (
    String name,
    String comment,
    DontCodeProjectContent content
) {

}


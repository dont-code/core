package net.dontcode.core.store;

public record UploadedDocumentInfo (
    String documentName,
    boolean isUrl,
    String documentId) {
}

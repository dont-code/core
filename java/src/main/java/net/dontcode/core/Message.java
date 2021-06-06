package net.dontcode.core;

/**
 * Definition of a message exchanged between services or between typescript client and services
**/

public class Message {

    protected MessageType type;
    protected String sessionId;
    protected Change change;

    public static enum MessageType {
        INIT,
        CHANGE
    }

    public Message(MessageType type, String sessionId) {
        this.type = type;
        this.sessionId = sessionId;
    }

    public Message(MessageType type, Change change) {
        this.type = type;
        this.change = change;
    }

    public Message() {
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Change getChange() {
        return change;
    }

    public void setChange(Change change) {
        this.change = change;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Message)) return false;

        Message message = (Message) o;

        if (type != message.type) return false;
        if (sessionId != null ? !sessionId.equals(message.sessionId) : message.sessionId != null) return false;
        return change != null ? change.equals(message.change) : message.change == null;
    }

    @Override
    public int hashCode() {
        int result = type.hashCode();
        result = 31 * result + (sessionId != null ? sessionId.hashCode() : 0);
        result = 31 * result + (change != null ? change.hashCode() : 0);
        return result;
    }
}

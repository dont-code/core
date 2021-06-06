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
}

package net.dontcode.core;

import java.util.LinkedHashMap;
import java.util.Map;

public class MapOrString {
    protected Map<String, MapOrString> map;
    protected String string;

    public MapOrString() {
        this.map = new LinkedHashMap<>();
    }

    public MapOrString(Map<String, MapOrString> map) {
        this.map = map;
    }

    public MapOrString(String string) {
        this.string = string;
    }

    public static MapOrString fromObject (Object from) {
        if( from instanceof String)
            return new MapOrString((String)from);
        else if (from instanceof MapOrString)
            return (MapOrString) from;
        else if (from instanceof Map<?,?>)
            return new MapOrString((Map<String,MapOrString>)from);
        else if (from==null)
            return null;
        else throw new RuntimeException("Cannot create a MapOrString from object of class "+ from.getClass().getName());
    }

    public boolean isMap () {
        return this.map!=null;
    }

    public boolean isString () {
        return this.string!=null;
    }

    public boolean isNull () {
        return ((this.string==null) && ((this.map==null)||(this.map.size()==0)));
    }

    public Map<String, MapOrString> getMap() {
        return map;
    }

    public boolean mapContainsKey(String key) {
        if (this.map!=null)
            return this.map.containsKey(key);
        else
            throw new RuntimeException("Not a map");
    }

    public MapOrString mapGet(String key) {
        if (this.map!=null)
            return this.map.get(key);
        else
            throw new RuntimeException("Not a map");
    }

    public void mapPut(String key, MapOrString val) {
        if (this.map!=null)
            this.map.put(key, val);
        else
            throw new RuntimeException("Not a map");
    }

    public void mapInsert(String key, MapOrString val, String beforeKey) {
        if( beforeKey==null) {
            this.mapRemove(key);
            this.mapPut(key, val);
        }else {
            if (this.map != null) {
                Map<String, MapOrString> newMap = new LinkedHashMap<>();

                this.map.entrySet().forEach(stringMapOrStringEntry -> {
                    if (beforeKey.equals(stringMapOrStringEntry.getKey())){
                        newMap.put(key, val);
                    }
                    if (!key.equals(stringMapOrStringEntry.getKey()))
                         newMap.put(stringMapOrStringEntry.getKey(), stringMapOrStringEntry.getValue());
                });
                this.map=newMap;
            }
            else
                throw new RuntimeException("Not a map");
        }
    }

    public void mapRemove(String key) {
        if (this.map!=null)
            this.map.remove(key);
        else
            throw new RuntimeException("Not a map");
    }

    public String getString() {
        return string;
    }

}

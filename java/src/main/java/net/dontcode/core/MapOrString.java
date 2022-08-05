package net.dontcode.core;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public class MapOrString {
    protected Map<String, Object> map;
    protected String string;

    public MapOrString() {
        this.map = new LinkedHashMap<>();
    }

    public MapOrString(Map<String, Object> map) {
        this.map = map;
    }

    public MapOrString(String string) {
        this.string = string;
    }

    public Object getMapOrStringValue () {
        return (this.map==null)?this.string:this.map;
    }
    public static MapOrString fromObject (Object from) {
        if( from instanceof String)
            return new MapOrString((String)from);
        else if (from instanceof MapOrString)
            return (MapOrString) from;
        else if (from instanceof Map<?,?>)
            return new MapOrString((Map<String,Object>)from);
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

    public Map<String, Object> getMap() {
        return map;
    }

    public boolean mapContainsKey(String key) {
        if (this.map!=null)
            return this.map.containsKey(key);
        else
            throw new RuntimeException("Not a map");
    }

    public MapOrString find (String toFind) {
        String[] positions = toFind.split("/");
        var cur = this.getMap();
        String nextPos;
        for (int i=0;i < positions.length; i++)  {
            nextPos = positions[i];
            var child = cur.get(nextPos);
            if( child instanceof Map<?,?>) {
                cur= (Map<String, Object>) child;
            } else if (i<positions.length-1){
                return null;
            } else
                return MapOrString.fromObject(child);
        }
        return MapOrString.fromObject(cur);
    }

    public Object mapGet(String key) {
        if (this.map!=null)
            return this.map.get(key);
        else
            throw new RuntimeException("Not a map");
    }

    /**
     * If the children at key is a map, then returns it, or returns null
     * @param key
     * @return
     */
    public Optional<Map<String,Object>> mapGetMap (String key) {
        var ret = mapGet(key);
        if (ret instanceof Map<?,?>) {
            return Optional.of((Map<String, Object>) ret);
        }else {
            return Optional.empty();
        }
    }

    public void mapPut(String key, Object val) {
        if (this.map!=null)
            this.map.put(key, val);
        else
            throw new RuntimeException("Not a map");
    }

    public void mapInsert(String key, Object val, String beforeKey) {
        if( beforeKey==null) {
            this.mapRemove(key);
            this.mapPut(key, val);
        }else {
            if (this.map != null) {
                Map<String, Object> newMap = new LinkedHashMap<>();

                this.map.entrySet().forEach(stringMapOrStringEntry -> {
                    if (beforeKey.equals(stringMapOrStringEntry.getKey())){
                        newMap.put(key, val);
                    }
                    if (!key.equals(stringMapOrStringEntry.getKey()))
                         newMap.put(stringMapOrStringEntry.getKey(), stringMapOrStringEntry.getValue());
                });
                this.map.clear();
                this.map.putAll(newMap);
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

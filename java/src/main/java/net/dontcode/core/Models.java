package net.dontcode.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Represents an application model.
 *
 */
public class Models {

    private static Logger log = LoggerFactory.getLogger(Models.class);
    /**
     * Merge the change into the model and returns the updated model.
     * Does the same as the typescript function applyChange https://github.com/dont-code/core/blob/main/node/packages/core/src/lib/model/dont-code-model-manager.ts
     * @param orig
     * @param toApply
     * @return
     */
    public static MapOrString applyChange (MapOrString orig, Change toApply) {
        String parentPosition = DontCodeModelPointer.parentPositionOf (toApply.position);
        MapOrString curContent = Models.findAtPosition (orig, parentPosition, false);
        if (curContent==null) {
            if (toApply.type== Change.ChangeType.DELETE) {
                return orig;
            } else {
                curContent= Models.findAtPosition (orig, parentPosition, true);
            }
        }

        if ((toApply.type== Change.ChangeType.MOVE) && (toApply.oldPosition==null) && (toApply.value==null)) {
            log.warn("Cannot apply MOVE Change without value or oldPosition for {}", toApply.position);
            return orig;
        }
        if ((toApply.value!=null) || (toApply.type== Change.ChangeType.MOVE)||(toApply.type== Change.ChangeType.DELETE))
            recursiveApplyChange (orig, toApply, curContent, MapOrString.fromObject(toApply.value), DontCodeModelPointer.lastElementOf(toApply.position), true);
        else {
            log.warn("Missing a value to non MOVE or DELETE change for {}", toApply.position);
        }
        return orig;
    }

    public static Map<String, Object> applyChange (Map<String, Object> orig, Change toApply) {
        if ((toApply==null)|| (orig==null))
            return orig;

        return applyChange(new MapOrString(orig), toApply).getMap();
    }

    public static MapOrString findAtPosition (MapOrString src, String position, boolean create) {
        var result= findAtPosition(src.getMap(), position, create);
        return MapOrString.fromObject(result);
    }

    public static Object findAtPosition (Map<String, Object> src, String position, boolean create) {
        if ((position==null)||(position.length()==0)||(src==null))
            return src;

        String[]path = position.split("/");
        Map<String, Object> cur = src;
        for (int i=0;i<path.length;i++) {
            var elt=path[i];
            if ( cur.get(elt) instanceof Map<?,?>) {
                cur = (Map<String, Object>) cur.get(elt);
            } else if ((cur.get(elt) instanceof String)&&(i == path.length-1)) {
                return cur.get(elt);
            } else if (create==false) {
                return null;
            } else {
                var newOne=new LinkedHashMap<String, Object>();
                cur.put(elt, newOne);
                cur = newOne;
            }
        }
        return cur;
    }

    protected static void recursiveApplyChange (MapOrString orig, Change toApply, MapOrString oldContent, MapOrString newContent, String position, boolean isRoot ) {
        if (position.indexOf('/')!=-1)
            throw new RuntimeException("Position must be single element");
        MapOrString curContent = ( position.length()==0)?oldContent:MapOrString.fromObject(oldContent.mapGet(position));

        switch (toApply.type) {
            case ADD:
            case UPDATE:
            case MOVE:
            case RESET:{
                if (toApply.type== Change.ChangeType.MOVE) {
                    if ((newContent == null) || (newContent.isNull())) {
                        newContent = Models.findAtPosition(orig, toApply.getOldPosition(), false);
                    }
                }
                if (curContent != null) {
                    if (curContent.isString()||(newContent==null)||newContent.isString()) {
                        if (isRoot)
                            oldContent.mapInsert(position, newContent.getMapOrStringValue(), toApply.beforeKey);
                        else
                            oldContent.mapInsert(position, newContent.getMapOrStringValue(), null);

                    } else {
                        Set<String> toRemove = new HashSet<>(curContent.getMap().keySet()); // Keep track of elements that will need to be deleted in case of reset or update
                        newContent.getMap().entrySet().forEach(newItem -> {
                            toRemove.remove(newItem.getKey());
                            if ((newItem.getValue()!=curContent.mapGet(newItem.getKey())))  // Don't bother adding the same element
                                recursiveApplyChange (orig, toApply, curContent, MapOrString.fromObject(newItem.getValue()), newItem.getKey(), false);
                        });
                        if ((toApply.type.equals(Change.ChangeType.RESET)) || (
                                toApply.type.equals(Change.ChangeType.UPDATE)
                                )) {
                            toRemove.forEach(s -> {
                                curContent.getMap().remove(s);
                            });
                        }

                        if ((isRoot) && (toApply.type.equals(Change.ChangeType.MOVE) || (toApply.beforeKey!=null))) {
                            oldContent.mapInsert(position, newContent.getMapOrStringValue(), toApply.beforeKey);
                        }
                    }
                }else {
                    oldContent.mapInsert(position, newContent.getMapOrStringValue(), toApply.beforeKey);
                    if (toApply.type== Change.ChangeType.MOVE) {
                        MapOrString parent = Models.findAtPosition(orig, DontCodeModelPointer.parentPositionOf(toApply.getOldPosition()), false);
                        parent.mapRemove(DontCodeModelPointer.lastElementOf(toApply.getOldPosition()));
                    }
                }
            }
            break;
            case DELETE: {
                if (curContent!=null) {
                    oldContent.mapRemove(position);
                }
            }
            break;
        }
    }
}

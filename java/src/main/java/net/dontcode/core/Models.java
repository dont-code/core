package net.dontcode.core;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Represents an application model.
 *
 */
public class Models {
    /**
     * Merge the change into the model and returns the updated model.
     * Does the same as the typescript function applyChange https://github.com/dont-code/core/blob/master/node/packages/core/src/lib/model/dont-code-model-manager.ts
     * @param orig
     * @param toApply
     * @return
     */
    public static Map<String, MapOrString> applyChange (Map<String, MapOrString> orig, Change toApply) {
        if (toApply==null)
            return orig;
        String parentPosition = DontCodeModelPointer.parentPositionOf (toApply.position);
        MapOrString curContent = Models.findAtPosition (orig, parentPosition, false);
        if (curContent==null) {
            if (toApply.type== Change.ChangeType.DELETE) {
                return orig;
            } else {
                curContent= Models.findAtPosition (orig, parentPosition, true);
            }
        }
        recursiveApplyChange (orig, toApply, curContent, MapOrString.fromObject(toApply.value), DontCodeModelPointer.lastElementOf(toApply.position), true);
        return orig;
    }

    public static MapOrString findAtPosition (MapOrString src, String position, boolean create) {
        if ((position==null)||(position.length()==0))
            return src;

        String[]path = position.split("/");
        MapOrString cur = src;
        for (String elt: path) {
            if (cur.mapContainsKey(elt)) {
                cur= cur.mapGet(elt);
            } else if (create==false) {
                return null;
            } else {
                MapOrString newOne=new MapOrString();
                cur.mapPut(elt, newOne);
                cur = newOne;
            }
        }
        return cur;
    }
        public static MapOrString findAtPosition (Map<String, MapOrString> src, String position, boolean create) {
        if ((position==null)||(position.length()==0))
            return new MapOrString(src);

        String[]path = position.split("/");
        return findAtPosition(new MapOrString(src), position, create);
    }

    protected static void recursiveApplyChange (Map<String, MapOrString> orig, Change toApply, MapOrString oldContent, MapOrString newContent, String position, boolean isRoot ) {
        if (position.indexOf('/')!=-1)
            throw new RuntimeException("Position must be single element");
        MapOrString curContent = ( position.length()==0)?oldContent:oldContent.mapGet(position);

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
                            oldContent.mapInsert(position, newContent, toApply.beforeKey);
                        else
                            oldContent.mapInsert(position, newContent, null);

                    } else {
                        Set<String> toRemove = new HashSet<>(curContent.getMap().keySet()); // Keep track of elements that will need to be deleted in case of reset or update
                        newContent.getMap().entrySet().forEach(newItem -> {
                            toRemove.remove(newItem.getKey());
                            if ((newItem.getValue()!=curContent.mapGet(newItem.getKey())))  // Don't bother adding the same element
                                recursiveApplyChange (orig, toApply, curContent, newItem.getValue(), newItem.getKey(), false);
                        });
                        if ((toApply.type.equals(Change.ChangeType.RESET)) || (
                                toApply.type.equals(Change.ChangeType.UPDATE)
                                )) {
                            toRemove.forEach(s -> {
                                curContent.getMap().remove(s);
                            });
                        }

                        if ((isRoot) && (toApply.type.equals(Change.ChangeType.MOVE) || (toApply.beforeKey!=null))) {
                            oldContent.mapInsert(position, newContent, toApply.beforeKey);
                        }
                    }
                }else {
                    oldContent.mapInsert(position, newContent, toApply.beforeKey);
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

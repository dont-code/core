package net.dontcode.core.test;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.dontcode.core.Change;
import net.dontcode.core.DontCodeModelPointer;

import java.util.LinkedHashMap;
import java.util.Map;

public class Utils {
    public static Map<String, Object> fromJsonToMap (String json) throws JsonProcessingException {
        if( json==null)
            return new LinkedHashMap<>();
        // convert JSON string to Java Map
        Map<String, Object> map = new ObjectMapper().readValue(json, LinkedHashMap.class);
        return map;
    }

    public static Change createJsonTestChange (Change.ChangeType type, String containerSchema, String containerItemId, String schema, String itemId, String value, String property) throws JsonProcessingException {
        return createTestChange(type,containerSchema, containerItemId,schema,itemId, Utils.fromJsonToMap(value), property);
    }

    public static Change createMoveChange (String oldPosition, String beforeIdOrProperty, String containerSchema, String containerItemId, String schema, String itemId, String property) {
        Change moveChange = createTestChange(Change.ChangeType.MOVE, containerSchema, containerItemId, schema, itemId, null, property);
        if( beforeIdOrProperty!=null)
            moveChange.setBeforeKey(beforeIdOrProperty);
        moveChange.setOldPosition(oldPosition);
        return moveChange;
    }

    public static Change createTestChange (Change.ChangeType type, String containerSchema, String containerItemId, String schema, String itemId, Object value, String property) {
        String calcContainerItemId = (containerItemId!=null) ? "/" + containerItemId : "";
        String calcItemId = (itemId!=null) ? "/" + itemId : "";
        String calcSchema = (schema!=null) ? "/" + schema : "";
        if (containerSchema.length() == 0) calcSchema = (schema!=null) ? schema : "";
        String calcProperty = (property!=null) ? "/" + property : "";
        if (containerSchema.length() == 0 && calcSchema.length() == 0)
            calcProperty = (property!=null) ? property : "";
        String calcPropertySchemaItem = (property!=null)
                ? calcSchema + calcItemId
                : (itemId!=null)? calcSchema : "";
        String calcPropertySchema = (property!=null) ? calcSchema : "";
        Boolean isProp = (property != null);
        String lastElement = (property!=null)?property:(itemId!=null)?itemId:null;

        return new Change(
                type,
                containerSchema +
                        calcContainerItemId +
                        calcSchema +
                        calcItemId +
                        calcProperty,
                value,
                new DontCodeModelPointer(
                        containerSchema +
                                calcContainerItemId +
                                calcSchema +
                                calcItemId +
                                calcProperty,
                        containerSchema + calcSchema + calcProperty,
                        containerSchema + calcContainerItemId + calcPropertySchemaItem,
                        containerSchema + calcPropertySchema,
                        lastElement,
                        isProp
      )
    );

    }
}

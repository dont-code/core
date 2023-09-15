export class DontCodeModel {
  static readonly ROOT = 'creation';
  static readonly APP_NAME_NODE = 'name';
  static readonly APP_TYPE_NODE = 'type';
  static readonly APP_TYPE =
    DontCodeModel.ROOT + '/' + DontCodeModel.APP_TYPE_NODE;
  static readonly APP_NAME =
    DontCodeModel.ROOT + '/' + DontCodeModel.APP_NAME_NODE;
  static readonly APP_ENTITIES_NODE = 'entities';
  static readonly APP_ENTITIES =
    DontCodeModel.ROOT + '/' + DontCodeModel.APP_ENTITIES_NODE;
  static readonly APP_ENTITIES_FROM_NODE = 'from';
  static readonly APP_ENTITIES_FROM =
    DontCodeModel.APP_ENTITIES + '/' + DontCodeModel.APP_ENTITIES_FROM_NODE;
  static readonly APP_ENTITIES_NAME_NODE = 'name';
  static readonly APP_ENTITIES_NAME =
    DontCodeModel.APP_ENTITIES + '/' + DontCodeModel.APP_ENTITIES_NAME_NODE;
  static readonly APP_FIELDS_NODE = 'fields';
  static readonly APP_FIELDS =
    DontCodeModel.APP_ENTITIES + '/' + DontCodeModel.APP_FIELDS_NODE;
  static readonly APP_FIELDS_NAME_NODE = 'name';
  static readonly APP_FIELDS_NAME =
    DontCodeModel.APP_FIELDS + '/' + DontCodeModel.APP_FIELDS_NAME_NODE;
  static readonly APP_FIELDS_TYPE_NODE = 'type';
  static readonly APP_FIELDS_TYPE =
    DontCodeModel.APP_FIELDS + '/' + DontCodeModel.APP_FIELDS_TYPE_NODE;
  static readonly APP_SHARING_NODE = 'sharing';
  static readonly APP_SHARING =
    DontCodeModel.ROOT + '/' + DontCodeModel.APP_SHARING_NODE;
  static readonly APP_SHARING_WITH_NODE = 'with';
  static readonly APP_SHARING_WITH =
    DontCodeModel.APP_SHARING + '/' + DontCodeModel.APP_SHARING_WITH_NODE;
  static readonly APP_REPORTS_NODE = 'reports';
  static readonly APP_REPORTS =
    DontCodeModel.ROOT + '/' + DontCodeModel.APP_REPORTS_NODE;
  static readonly APP_REPORTS_TITLE_NODE = 'title';
  static readonly APP_REPORTS_TITLE =
    DontCodeModel.APP_REPORTS + '/' + DontCodeModel.APP_REPORTS_TITLE_NODE;
  static readonly APP_REPORTS_FOR_NODE = 'for';
  static readonly APP_REPORTS_FOR =
    DontCodeModel.APP_REPORTS + '/' + DontCodeModel.APP_REPORTS_FOR_NODE;
  static readonly APP_REPORTS_GROUP_NODE = 'groupedBy';
  static readonly APP_REPORTS_GROUP =
    DontCodeModel.APP_REPORTS + '/' + DontCodeModel.APP_REPORTS_GROUP_NODE;
  static readonly APP_REPORTS_SORT_NODE = 'sortedBy';
  static readonly APP_REPORTS_SORT =
    DontCodeModel.APP_REPORTS + '/' + DontCodeModel.APP_REPORTS_SORT_NODE;
  static readonly APP_REPORTS_DISPLAY_NODE = 'as';
  static readonly APP_REPORTS_DISPLAY =
    DontCodeModel.APP_REPORTS + '/' + DontCodeModel.APP_REPORTS_DISPLAY_NODE;
  static readonly APP_REPORTS_GROUP_LABEL_NODE = 'label';
  static readonly APP_REPORTS_GROUP_LABEL =
    DontCodeModel.APP_REPORTS_GROUP + '/' + DontCodeModel.APP_REPORTS_GROUP_LABEL_NODE;
  static readonly APP_REPORTS_GROUP_OF_NODE = 'of';
  static readonly APP_REPORTS_GROUP_OF =
    DontCodeModel.APP_REPORTS_GROUP + '/' + DontCodeModel.APP_REPORTS_GROUP_OF_NODE;
  static readonly APP_REPORTS_GROUP_SHOW_NODE = 'show';
  static readonly APP_REPORTS_GROUP_SHOW =
    DontCodeModel.APP_REPORTS_GROUP + '/' + DontCodeModel.APP_REPORTS_GROUP_SHOW_NODE;
  static readonly APP_REPORTS_GROUP_AGGREGATE_NODE = 'display';
  static readonly APP_REPORTS_GROUP_AGGREGATE =
    DontCodeModel.APP_REPORTS_GROUP + '/' + DontCodeModel.APP_REPORTS_GROUP_AGGREGATE_NODE;
  static readonly APP_REPORTS_GROUP_AGGREGATE_LABEL_NODE = 'label';
  static readonly APP_REPORTS_GROUP_AGGREGATE_LABEL =
    DontCodeModel.APP_REPORTS_GROUP_AGGREGATE + '/' + DontCodeModel.APP_REPORTS_GROUP_AGGREGATE_LABEL_NODE;
  static readonly APP_REPORTS_GROUP_AGGREGATE_OPERATION_NODE = 'operation';
  static readonly APP_REPORTS_GROUP_AGGREGATE_OPERATION =
    DontCodeModel.APP_REPORTS_GROUP_AGGREGATE + '/' + DontCodeModel.APP_REPORTS_GROUP_AGGREGATE_OPERATION_NODE;
  static readonly APP_REPORTS_GROUP_AGGREGATE_OF_NODE = 'of';
  static readonly APP_REPORTS_GROUP_AGGREGATE_OF =
    DontCodeModel.APP_REPORTS_GROUP_AGGREGATE + '/' + DontCodeModel.APP_REPORTS_GROUP_AGGREGATE_OF_NODE;
  static readonly APP_REPORTS_SORT_BY_NODE = 'by';
  static readonly APP_REPORTS_SORT_BY =
    DontCodeModel.APP_REPORTS_SORT + '/' + DontCodeModel.APP_REPORTS_SORT_BY_NODE;
  static readonly APP_REPORTS_SORT_DIRECTION_NODE = 'direction';
  static readonly APP_REPORTS_SORT_DIRECTION =
    DontCodeModel.APP_REPORTS_SORT + '/' + DontCodeModel.APP_REPORTS_SORT_DIRECTION_NODE;
  static readonly APP_REPORTS_DISPLAY_TITLE_NODE = 'title';
  static readonly APP_REPORTS_DISPLAY_TITLE =
    DontCodeModel.APP_REPORTS_DISPLAY + '/' + DontCodeModel.APP_REPORTS_DISPLAY_TITLE_NODE;
  static readonly APP_REPORTS_DISPLAY_TYPE_NODE = 'type';
  static readonly APP_REPORTS_DISPLAY_TYPE =
    DontCodeModel.APP_REPORTS_DISPLAY + '/' + DontCodeModel.APP_REPORTS_DISPLAY_TYPE_NODE;
  static readonly APP_REPORTS_DISPLAY_OF_NODE = 'of';
  static readonly APP_REPORTS_DISPLAY_OF =
    DontCodeModel.APP_REPORTS_DISPLAY + '/' + DontCodeModel.APP_REPORTS_DISPLAY_OF_NODE;
  static readonly APP_REPORTS_DISPLAY_BY_NODE = 'by';
  static readonly APP_REPORTS_DISPLAY_BY =
    DontCodeModel.APP_REPORTS_DISPLAY + '/' + DontCodeModel.APP_REPORTS_DISPLAY_BY_NODE;
  static readonly APP_SOURCES_NODE = 'sources';
  static readonly APP_SOURCES =
    DontCodeModel.ROOT + '/' + DontCodeModel.APP_SOURCES_NODE;
  static readonly APP_SOURCES_NAME_NODE = 'name';
  static readonly APP_SOURCES_NAME =
    DontCodeModel.ROOT +
    '/' +
    DontCodeModel.APP_SOURCES_NODE +
    '/' +
    DontCodeModel.APP_SOURCES_NAME_NODE;
  static readonly APP_SOURCES_TYPE_NODE = 'type';
  static readonly APP_SOURCES_TYPE =
    DontCodeModel.ROOT +
    '/' +
    DontCodeModel.APP_SOURCES_NODE +
    '/' +
    DontCodeModel.APP_SOURCES_TYPE_NODE;
  static readonly APP_SOURCES_URL_NODE = 'url';
  static readonly APP_SOURCES_URL =
    DontCodeModel.ROOT +
    '/' +
    DontCodeModel.APP_SOURCES_NODE +
    '/' +
    DontCodeModel.APP_SOURCES_URL_NODE;
  static readonly APP_SCREENS_NODE = 'screens';
  static readonly APP_SCREENS =
    DontCodeModel.ROOT + '/' + DontCodeModel.APP_SCREENS_NODE;
  static readonly APP_SCREENS_NAME_NODE = 'name';
  static readonly APP_SCREENS_NAME =
    DontCodeModel.APP_SCREENS + '/' + DontCodeModel.APP_SCREENS_NAME_NODE;
  static readonly APP_SCREENS_LAYOUT_NODE = 'layout';
  static readonly APP_SCREENS_LAYOUT =
    DontCodeModel.APP_SCREENS + '/' + DontCodeModel.APP_SCREENS_LAYOUT_NODE;
  static readonly APP_COMPONENTS_NODE = 'components';
  static readonly APP_COMPONENTS =
    DontCodeModel.APP_SCREENS + '/' + DontCodeModel.APP_COMPONENTS_NODE;
  static readonly APP_COMPONENTS_TYPE_NODE = 'type';
  static readonly APP_COMPONENTS_TYPE =
    DontCodeModel.APP_COMPONENTS + '/' + DontCodeModel.APP_COMPONENTS_TYPE_NODE;
  static readonly APP_COMPONENTS_ENTITY_NODE = 'entity';
  static readonly APP_COMPONENTS_ENTITY =
    DontCodeModel.APP_COMPONENTS +
    '/' +
    DontCodeModel.APP_COMPONENTS_ENTITY_NODE;
}

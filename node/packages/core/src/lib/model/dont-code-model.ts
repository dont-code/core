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

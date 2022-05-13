import { DontCodeCore } from './dontcode';
import { DontCodeSchemaManager } from './model/dont-code-schema-manager';
import { DontCodePreviewManager } from './plugin/preview/dont-code-preview-manager';
import { DontCodeStoreManager } from './store/dont-code-store-manager';
import { DontCodeModelManager } from './model/dont-code-model-manager';

export interface Core {
  getSchemaUri(): string;
  registerPlugin(plugin: Plugin): void;
  initPlugins (): void;
  getSchemaManager(): DontCodeSchemaManager;
  getModelManager(): DontCodeModelManager;
  getPreviewManager(): DontCodePreviewManager;
  getStoreManager(): DontCodeStoreManager;
}

if (!(self as any).dontCodeCore)
  (self as any).dontCodeCore = new DontCodeCore();
// eslint-disable-next-line no-var
export var dtcde: Core = (self as any).dontCodeCore;

export interface Plugin {
  getConfiguration(): PluginConfig;
  /**
   * Once all plugins have been loaded, each one pluginInit's is being called.
   * @param dontCode
   */
  pluginInit (dontCode: Core): void;
}

/**
 * The typescript equivalent of the dont-code-schema.json
 */
export interface DontCodeSchemaType {
  creation: {
    type: string;
    name: string;
    entities?: Array<DontCodeEntityType>;
    sources?: Array<DontCodeSourceType>;
    screens?: Array<{
      name: string;
    }>;
  };
}

export interface DontCodeFieldType {
  name: string;
  type: string;
}

export interface DontCodeEntityType {
  from: string;
  name: string;
  fields?: Array<DontCodeFieldType>;
}

export interface DontCodeSourceType {
  name: string;
  type: string;
}

/**
 * The typescript equivalent of plugin-config-schema.json
 */
export interface PluginConfig {
  plugin: {
    id: string;
    'display-name'?: string;
    version: string;
  };
  'schema-updates'?: Array<{
    id: string;
    description?: string;
    changes: Array<ChangeConfig>;
  }>;
  'preview-handlers'?: Array<ChangeHandlerConfig>;
  'global-handlers'?: Array<ChangeHandlerConfig>;
  'definition-updates'?: Array<DefinitionUpdateConfig>
}

export interface ChangeConfig {
  location: LocationConfig;
  update?: any;
  props?: any;
  replace?: boolean;
}

export interface ChangeHandlerConfig {
  location: LocationConfig;
  class: {
    source: string;
    name: string;
  };
}

export interface LocationConfig {
  parent: string;
  id?: string;
  after?: string;
  values?: any;
}

export interface DefinitionUpdateConfig {
  location: LocationConfig;
  update: any;
}

export {};

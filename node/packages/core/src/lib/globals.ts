import { DontCodeSchemaManager } from './model/dont-code-schema-manager';
import { DontCodePreviewManager } from './plugin/preview/dont-code-preview-manager';
import { DontCodeStoreManager } from './store/dont-code-store-manager';
import { DontCodeModelManager } from './model/dont-code-model-manager';
import {DontCodeChangeManager} from "./change/dont-code-change-manager";

export interface Core {
  getSchemaUri(): string;
  registerPlugin(plugin: Plugin): void;
  initPlugins (): void;
  getSchemaManager(): DontCodeSchemaManager;
  getModelManager(): DontCodeModelManager;
  getChangeManager(): DontCodeChangeManager;
  getPreviewManager(): DontCodePreviewManager;
  getStoreManager(): DontCodeStoreManager;
  reset(): Core;
}

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
    entities?: {[key:string]:DontCodeEntityType};
    sharing?: DontCodeSharingType;
    reports?: {[key:string]:DontCodeReportType};
    sources?: {[key:string]:DontCodeSourceType};
    screens?: Array<{
      name: string;
    }>;
  };
}

export interface DontCodeEntityType {
  from?: string;
  name: string;
  fields?: {[key:string]:DontCodeFieldType};
}

export interface DontCodeFieldType {
  name: string;
  type: string;
}

export interface DontCodeSharingType {
  with: string;
}

export interface DontCodeReportType {
  title: string;
  for: string;
  groupedBy?: {[key:string]:DontCodeReportGroupType};
  sortedBy?: {[key:string]:DontCodeReportSortType};
  as?: {[key:string]:DontCodeReportDisplayType};
}

export interface DontCodeReportGroupType {
  of: string,
  display:{[key:string]:DontCodeReportGroupAggregateType};
  show?:DontCodeReportGroupShowType,
  label?:string,
}

export interface DontCodeReportGroupAggregateType {
  operation: DontCodeGroupOperationType;
  of:string,
  label?:string
}

export enum DontCodeReportGroupShowType {
  OnlyLowest="OnlyLowest",
  OnlyHighest="OnlyHighest"
}

export enum DontCodeGroupOperationType {
  Count= "Count",
  Sum="Sum",
  Average="Average",
  Minimum="Minimum",
  Maximum="Maximum"
}

export interface DontCodeReportSortType {
  by:string,
  direction: DontCodeSortDirectionType
}

export enum DontCodeSortDirectionType {
  None = "None",
  Ascending = "Ascending",
  Descending = "Descending"
}

export interface DontCodeReportDisplayType {
  type: string;
  of: string;
  by?:string;
  title: string;
}

export interface DontCodeSourceType {
  name: string;
  type: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DontCodeSharingType {

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
  'action-handlers'?: Array<ActionHandlerConfig>;
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

export interface ChangeHandlerConfig {
  location: LocationConfig;
  class: ClassDefinitionConfig;
}

export interface ClassDefinitionConfig {
  source: string;
  name: string;
}

export interface ActionHandlerConfig {
  location: LocationConfig;
  'action-context': ActionContextType;
  actions: Array<ActionConfig>;
  class: ClassDefinitionConfig
}

export enum ActionContextType {
  LIST="list",
  EDIT="edit",
  VIEW="view"
}

export interface ActionConfig {
  type:ActionType;
  'display-name':string;
  icon: IconDefinitionConfig;
}

export enum ActionType {
  EXTRACT="extract",
  UPDATE="update",
  CALCULATE="calculate"
}

export interface IconDefinitionConfig {
  url?:string;
}


/**
 * The typescript equivalent of repository-schema.json
 */
export interface RepositorySchema {
  name:string,
  description?:string,
  plugins: Array<RepositoryPluginEntry>
}

export interface RepositoryPluginEntry {
  id:string,
  "display-name"?:string,
  version:string,
  info?: RepositoryPluginInfo,
  config?: RepositoryPluginConfig
}

export interface RepositoryPluginInfo {
  "exposed-module":string,
  "remote-entry"?:string
}

export interface RepositoryPluginConfig {
  "definition-updates"?:Array<DefinitionUpdateConfig>
}

export {};

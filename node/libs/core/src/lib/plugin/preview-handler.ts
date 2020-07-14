import { CommandProviderInterface } from "./command-provider-interface";

export interface PreviewHandler {
  initCommandFlow (provider:CommandProviderInterface, position:string, schemaPosition:string);
}

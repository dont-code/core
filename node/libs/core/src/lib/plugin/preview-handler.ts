import { CommandProviderInterface } from "./command-provider-interface";
import { DontCodeModelPointer } from "../..";

export interface PreviewHandler {
  initCommandFlow (provider:CommandProviderInterface, pointer:DontCodeModelPointer);
}

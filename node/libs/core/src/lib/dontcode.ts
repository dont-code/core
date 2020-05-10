import { DontCode } from "./globals";

export class DontCodeCore implements DontCode.Core{
    registerPlugin(plugin: DontCode.Plugin): void {
        throw new Error("Method not implemented.");
    }

    getSchemaUri(): string {
      return "schemas/dont-code-schema.json";
    }

}


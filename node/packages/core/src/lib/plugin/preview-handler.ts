import { CommandProviderInterface } from './command-provider-interface';
import { Change, DontCodeModelPointer } from '../..';

export interface PreviewHandler {
  initCommandFlow(
    provider: CommandProviderInterface,
    pointer: DontCodeModelPointer
  ): void;
  handleChange(change: Change): void;
}

import { registerEnumType } from '../../../lib';

export enum SampleOrphanedEnum {
  Red = 'RED',
  Blue = 'BLUE',
  Black = 'BLACK',
  White = 'WHITE',
}

registerEnumType(SampleOrphanedEnum, {
  name: 'SampleOrphanedEnum',
  description: 'orphaned enum',
});

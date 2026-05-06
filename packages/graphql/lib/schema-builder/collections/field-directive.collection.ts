import { PropertyDirectiveMetadata } from '../metadata/index.js';
import { MetadataListByNameCollection } from './metadata-list-by-name.collection.js';

export class FieldDirectiveCollection extends MetadataListByNameCollection<PropertyDirectiveMetadata> {
  sdls = new Set<string>();
  fieldNames = new Set<string>();
  uniqueCombinations = new Set<string>();

  add(value: PropertyDirectiveMetadata) {
    const combinationKey = `${value.sdl}${value.fieldName}`;
    if (this.uniqueCombinations.has(combinationKey)) {
      return;
    }

    super.add(value, value.fieldName);

    this.sdls.add(value.sdl);
    this.fieldNames.add(value.fieldName);
    this.uniqueCombinations.add(combinationKey);
    this.globalArray?.push(value);
  }
}

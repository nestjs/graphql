import { PropertyDirectiveMetadata } from '../metadata';
import { MetadataListByNameCollection } from './metadata-list-by-name.collection';

export class FieldDirectiveCollection extends MetadataListByNameCollection<PropertyDirectiveMetadata> {
  sdls = new Set<string>();
  fieldNames = new Set<string>();

  add(value: PropertyDirectiveMetadata) {
    if (this.sdls.has(value.sdl) && this.fieldNames.has(value.fieldName)) {
      return;
    }

    super.add(value, value.fieldName);

    this.sdls.add(value.sdl);
    this.fieldNames.add(value.fieldName);
    this.globalArray?.push(value);
  }
}

import { SetMetadata } from '@nestjs/common';
import { ClassType } from '../enums/class-type.enum.js';
import { CLASS_TYPE_METADATA } from '../graphql.constants.js';

export function addClassTypeMetadata(target: Function, classType: ClassType) {
  const decoratorFactory: ClassDecorator = SetMetadata(
    CLASS_TYPE_METADATA,
    classType,
  );
  decoratorFactory(target);
}

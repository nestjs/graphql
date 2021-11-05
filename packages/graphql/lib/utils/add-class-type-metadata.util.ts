import { SetMetadata } from '@nestjs/common';
import { ClassType } from '../enums/class-type.enum';
import { CLASS_TYPE_METADATA } from '../graphql.constants';

export function addClassTypeMetadata(target: Function, classType: ClassType) {
  const decoratorFactory: ClassDecorator = SetMetadata(
    CLASS_TYPE_METADATA,
    classType,
  );
  decoratorFactory(target);
}

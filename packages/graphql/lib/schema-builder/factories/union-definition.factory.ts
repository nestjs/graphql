import { Injectable, Type } from '@nestjs/common';
import { GraphQLUnionType } from 'graphql';
import { ReturnTypeCannotBeResolvedError } from '../errors/return-type-cannot-be-resolved.error';
import { UnionMetadata } from '../metadata';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
import { ResolveTypeFactory } from './resolve-type.factory';

export interface UnionDefinition {
  id: symbol;
  type: GraphQLUnionType;
}

@Injectable()
export class UnionDefinitionFactory {
  constructor(
    private readonly resolveTypeFactory: ResolveTypeFactory,
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
  ) {}

  public create(metadata: UnionMetadata): UnionDefinition {
    const getObjectType = (item: Type<unknown>) =>
      this.typeDefinitionsStorage.getObjectTypeByTarget(item).type;
    const types = () => metadata.typesFn().map((item) => getObjectType(item));

    return {
      id: metadata.id,
      type: new GraphQLUnionType({
        name: metadata.name,
        description: metadata.description,
        types,
        resolveType: this.createResolveTypeFn(metadata),
      }),
    };
  }

  private createResolveTypeFn(metadata: UnionMetadata) {
    return metadata.resolveType
      ? this.resolveTypeFactory.getResolveTypeFunction(metadata.resolveType)
      : (instance: any) => {
          const target = metadata
            .typesFn()
            .find((Type) => instance instanceof Type);

          if (!target) {
            if (Reflect.has(instance, '__typename')) {
              return instance.__typename;
            }
            throw new ReturnTypeCannotBeResolvedError(metadata.name);
          }
          const objectDef =
            this.typeDefinitionsStorage.getObjectTypeByTarget(target);
          return objectDef.type?.name;
        };
  }
}

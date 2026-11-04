import { Injectable } from '@nestjs/common';
import { GraphQLInputType, isNonNullType } from 'graphql';
import {
  BuildSchemaOptions,
  GqlTypeReference,
} from '../../interfaces/index.js';
import { TypeOptions } from '../../interfaces/type-options.interface.js';
import { CannotDetermineInputTypeError } from '../errors/cannot-determine-input-type.error.js';
import { DefaultNullableConflictError } from '../errors/default-nullable-conflict.error.js';
import { TypeMapperService } from '../services/type-mapper.service.js';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage.js';

@Injectable()
export class InputTypeFactory {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly typeMapperService: TypeMapperService,
  ) {}

  public create(
    hostType: string,
    typeRef: GqlTypeReference,
    buildOptions: BuildSchemaOptions,
    typeOptions: TypeOptions = {},
  ): GraphQLInputType {
    let inputType: GraphQLInputType | undefined =
      this.typeMapperService.mapToScalarType(
        typeRef,
        buildOptions.scalarsMap,
        buildOptions.dateScalarMode,
        buildOptions.numberScalarMode,
      );
    if (!inputType) {
      inputType = this.typeDefinitionsStorage.getInputTypeAndExtract(
        typeRef as any,
      );
      if (!inputType) {
        const isRegisteredAsObjectType =
          typeof typeRef === 'function' &&
          !!this.typeDefinitionsStorage.getObjectTypeByTarget(
            typeRef as Function,
          );
        throw new CannotDetermineInputTypeError(
          hostType,
          typeRef,
          isRegisteredAsObjectType,
        );
      }
    }
    const type = this.typeMapperService.mapToGqlType(
      hostType,
      inputType,
      typeOptions,
    );
    // graphql-js treats any default other than "undefined" as a default, so
    // "null" would make a non-nullable argument / input field optional (and
    // pass "null" to the resolver) while the schema still shows it as required.
    if (typeOptions.defaultValue === null && isNonNullType(type)) {
      throw new DefaultNullableConflictError(
        hostType,
        typeOptions.defaultValue,
        typeOptions.nullable ?? false,
      );
    }
    return type;
  }
}

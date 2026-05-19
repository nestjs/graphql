import { Injectable } from '@nestjs/common';
import { GraphQLInputType } from 'graphql';
import {
  BuildSchemaOptions,
  GqlTypeReference,
} from '../../interfaces/index.js';
import { TypeOptions } from '../../interfaces/type-options.interface.js';
import { CannotDetermineInputTypeError } from '../errors/cannot-determine-input-type.error.js';
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
    return this.typeMapperService.mapToGqlType(
      hostType,
      inputType,
      typeOptions,
    );
  }
}

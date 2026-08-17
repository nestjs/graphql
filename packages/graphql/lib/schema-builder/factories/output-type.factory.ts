import { Injectable } from '@nestjs/common';
import { GraphQLOutputType } from 'graphql';
import {
  BuildSchemaOptions,
  GqlTypeReference,
} from '../../interfaces/index.js';
import { TypeOptions } from '../../interfaces/type-options.interface.js';
import { CannotDetermineOutputTypeError } from '../errors/cannot-determine-output-type.error.js';
import { TypeMapperService } from '../services/type-mapper.service.js';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage.js';

@Injectable()
export class OutputTypeFactory {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly typeMapperService: TypeMapperService,
  ) {}

  public create(
    hostType: string,
    typeRef: GqlTypeReference,
    buildOptions: BuildSchemaOptions,
    typeOptions: TypeOptions = {},
  ): GraphQLOutputType {
    let gqlType: GraphQLOutputType | undefined =
      this.typeMapperService.mapToScalarType(
        typeRef,
        buildOptions.scalarsMap,
        buildOptions.dateScalarMode,
        buildOptions.numberScalarMode,
      );
    if (!gqlType) {
      gqlType = this.typeDefinitionsStorage.getOutputTypeAndExtract(typeRef);
      if (!gqlType) {
        throw new CannotDetermineOutputTypeError(hostType);
      }
    }
    return this.typeMapperService.mapToGqlType(hostType, gqlType, typeOptions);
  }
}

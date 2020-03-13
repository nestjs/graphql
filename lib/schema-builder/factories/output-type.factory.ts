import { Injectable } from '@nestjs/common';
import { GraphQLOutputType } from 'graphql';
import { BuildSchemaOptions, GqlTypeReference } from '../../interfaces';
import { TypeOptions } from '../../interfaces/type-options.interface';
import { TypeMapperSevice } from '../services/type-mapper.service';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';

@Injectable()
export class OutputTypeFactory {
  constructor(
    private readonly typeDefinitionsStorage: TypeDefinitionsStorage,
    private readonly typeMapperService: TypeMapperSevice,
  ) {}

  public create(
    hostType: string,
    typeRef: GqlTypeReference,
    buildOptions: BuildSchemaOptions,
    typeOptions: TypeOptions = {},
  ): GraphQLOutputType {
    let gqlType:
      | GraphQLOutputType
      | undefined = this.typeMapperService.mapToScalarType(
      typeRef,
      buildOptions.scalarsMap,
      buildOptions.dateScalarMode,
    );
    if (!gqlType) {
      gqlType = this.typeDefinitionsStorage.getOutputTypeAndExtract(typeRef);
      if (!gqlType) {
        throw new Error(
          `Cannot determine GraphQL output type for ${hostType}`!,
        );
      }
    }

    return this.typeMapperService.mapToGqlType(hostType, gqlType, typeOptions);
  }
}

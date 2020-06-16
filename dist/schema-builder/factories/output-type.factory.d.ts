import { GraphQLOutputType } from 'graphql';
import { BuildSchemaOptions, GqlTypeReference } from '../../interfaces';
import { TypeOptions } from '../../interfaces/type-options.interface';
import { TypeMapperSevice } from '../services/type-mapper.service';
import { TypeDefinitionsStorage } from '../storages/type-definitions.storage';
export declare class OutputTypeFactory {
  private readonly typeDefinitionsStorage;
  private readonly typeMapperService;
  constructor(
    typeDefinitionsStorage: TypeDefinitionsStorage,
    typeMapperService: TypeMapperSevice,
  );
  create(
    hostType: string,
    typeRef: GqlTypeReference,
    buildOptions: BuildSchemaOptions,
    typeOptions?: TypeOptions,
  ): GraphQLOutputType;
}

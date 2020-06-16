import { Type } from '@nestjs/common';
import { GraphQLScalarType, GraphQLType } from 'graphql';
import {
  DateScalarMode,
  GqlTypeReference,
  ScalarsTypeMap,
} from '../../interfaces';
import { TypeOptions } from '../../interfaces/type-options.interface';
export declare class TypeMapperSevice {
  mapToScalarType<T extends GqlTypeReference = Type<unknown>>(
    typeRef: T,
    scalarsMap?: ScalarsTypeMap[],
    dateScalarMode?: DateScalarMode,
  ): GraphQLScalarType | undefined;
  mapToGqlType<T extends GraphQLType = GraphQLType>(
    hostType: string,
    typeRef: T,
    options: TypeOptions,
    isInputTypeCtx: boolean,
  ): T;
  private validateTypeOptions;
  private mapToGqlList;
  private hasArrayOptions;
}

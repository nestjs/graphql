import { Injectable, Type } from '@nestjs/common';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLString,
  GraphQLType,
} from 'graphql';
import {
  DateScalarMode,
  GqlTypeReference,
  NumberScalarMode,
  ScalarsTypeMap,
} from '../../interfaces';
import { TypeOptions } from '../../interfaces/type-options.interface';
import { GraphQLISODateTime, GraphQLTimestamp } from '../../scalars';
import { DefaultNullableConflictError } from '../errors/default-nullable-conflict.error';
import { InvalidNullableOptionError } from '../errors/invalid-nullable-option.error';

@Injectable()
export class TypeMapperSevice {
  mapToScalarType<T extends GqlTypeReference = Type<unknown>>(
    typeRef: T,
    scalarsMap: ScalarsTypeMap[] = [],
    dateScalarMode: DateScalarMode = 'isoDate',
    numberScalarMode: NumberScalarMode = 'float',
  ): GraphQLScalarType | undefined {
    if (typeRef instanceof GraphQLScalarType) {
      return typeRef;
    }
    const scalarHost = scalarsMap.find((item) => item.type === typeRef);
    if (scalarHost) {
      return scalarHost.scalar;
    }
    const dateScalar =
      dateScalarMode === 'timestamp' ? GraphQLTimestamp : GraphQLISODateTime;
    const numberScalar =
      numberScalarMode === 'float' ? GraphQLFloat : GraphQLInt;

    const typeScalarMapping = new Map<Function, GraphQLScalarType>([
      [String, GraphQLString],
      [Number, numberScalar],
      [Boolean, GraphQLBoolean],
      [Date, dateScalar],
    ]);
    return typeScalarMapping.get(typeRef as Function);
  }

  mapToGqlType<T extends GraphQLType = GraphQLType>(
    hostType: string,
    typeRef: T,
    options: TypeOptions,
    isInputTypeCtx: boolean,
  ): T {
    this.validateTypeOptions(hostType, options);
    let graphqlType: T | GraphQLList<T> | GraphQLNonNull<T> = typeRef;

    if (options.isArray) {
      graphqlType = this.mapToGqlList(
        graphqlType,
        options.arrayDepth,
        this.hasArrayOptions(options),
      );
    }

    let isNotNullable: boolean;
    if (isInputTypeCtx) {
      /**
       * The input values (e.g., args) remain "nullable"
       * even if the "defaultValue" is specified.
       */
      isNotNullable =
        isUndefined(options.defaultValue) &&
        (!options.nullable || options.nullable === 'items');
    } else {
      isNotNullable = !options.nullable || options.nullable === 'items';
    }
    return isNotNullable
      ? (new GraphQLNonNull(graphqlType) as T)
      : (graphqlType as T);
  }

  private validateTypeOptions(hostType: string, options: TypeOptions) {
    if (!options.isArray && this.hasArrayOptions(options)) {
      throw new InvalidNullableOptionError(hostType, options.nullable);
    }

    const isNotNullable = options.nullable === 'items';
    if (!isUndefined(options.defaultValue) && isNotNullable) {
      throw new DefaultNullableConflictError(
        hostType,
        options.defaultValue,
        options.nullable,
      );
    }
    return true;
  }

  private mapToGqlList<T extends GraphQLType = GraphQLType>(
    targetType: T,
    depth: number,
    nullable: boolean,
  ): GraphQLList<T> {
    const targetTypeNonNull = nullable
      ? targetType
      : new GraphQLNonNull(targetType);

    if (depth === 0) {
      return targetType as GraphQLList<T>;
    }
    return this.mapToGqlList<T>(
      new GraphQLList(targetTypeNonNull) as T,
      depth - 1,
      nullable,
    );
  }

  private hasArrayOptions(options: TypeOptions) {
    return options.nullable === 'items' || options.nullable === 'itemsAndList';
  }
}

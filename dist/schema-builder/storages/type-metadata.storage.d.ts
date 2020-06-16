import { Type } from '@nestjs/common';
import {
  ClassExtensionsMetadata,
  ClassMetadata,
  EnumMetadata,
  FieldResolverMetadata,
  MethodArgsMetadata,
  PropertyExtensionsMetadata,
  PropertyMetadata,
  ResolverClassMetadata,
  ResolverTypeMetadata,
  UnionMetadata,
} from '../metadata';
import {
  ClassDirectiveMetadata,
  PropertyDirectiveMetadata,
} from '../metadata/directive.metadata';
import { InterfaceMetadata } from '../metadata/interface.metadata';
import { ObjectTypeMetadata } from '../metadata/object-type.metadata';
export declare class TypeMetadataStorageHost {
  private queries;
  private mutations;
  private subscriptions;
  private fieldResolvers;
  private readonly resolvers;
  private readonly fields;
  private readonly params;
  private readonly interfaces;
  private readonly enums;
  private readonly unions;
  private readonly classDirectives;
  private readonly fieldDirectives;
  private readonly classExtensions;
  private readonly fieldExtensions;
  private readonly objectTypes;
  private readonly inputTypes;
  private readonly argumentTypes;
  addMutationMetadata(metadata: ResolverTypeMetadata): void;
  getMutationsMetadata(): ResolverTypeMetadata[];
  addQueryMetadata(metadata: ResolverTypeMetadata): void;
  getQueriesMetadata(): ResolverTypeMetadata[];
  addSubscriptionMetadata(metadata: ResolverTypeMetadata): void;
  getSubscriptionsMetadata(): ResolverTypeMetadata[];
  addResolverPropertyMetadata(metadata: FieldResolverMetadata): void;
  addArgsMetadata(metadata: ClassMetadata): void;
  getArgumentsMetadata(): ClassMetadata[];
  getArgumentsMetadataByTarget(
    target: Type<unknown>,
  ): ClassMetadata | undefined;
  addInterfaceMetadata(metadata: InterfaceMetadata): void;
  getInterfacesMetadata(): InterfaceMetadata[];
  getInterfaceMetadataByTarget(
    target: Type<unknown>,
  ): InterfaceMetadata | undefined;
  addInputTypeMetadata(metadata: ClassMetadata): void;
  getInputTypesMetadata(): ClassMetadata[];
  getInputTypeMetadataByTarget(
    target: Type<unknown>,
  ): ObjectTypeMetadata | undefined;
  addObjectTypeMetadata(metadata: ObjectTypeMetadata): void;
  getObjectTypesMetadata(): ObjectTypeMetadata[];
  getObjectTypeMetadataByTarget(
    target: Type<unknown>,
  ): ObjectTypeMetadata | undefined;
  addEnumMetadata(metadata: EnumMetadata): void;
  getEnumsMetadata(): EnumMetadata[];
  addUnionMetadata(metadata: UnionMetadata): void;
  getUnionsMetadata(): UnionMetadata[];
  addDirectiveMetadata(metadata: ClassDirectiveMetadata): void;
  addDirectivePropertyMetadata(metadata: PropertyDirectiveMetadata): void;
  addExtensionsMetadata(metadata: ClassExtensionsMetadata): void;
  addExtensionsPropertyMetadata(metadata: PropertyExtensionsMetadata): void;
  addResolverMetadata(metadata: ResolverClassMetadata): void;
  addClassFieldMetadata(metadata: PropertyMetadata): void;
  addMethodParamMetadata(metadata: MethodArgsMetadata): void;
  compile(orphanedTypes?: Function[]): void;
  loadClassPluginMetadata(metadata: ClassMetadata[]): void;
  applyPluginMetadata(prototype: Function): void;
  private compileClassMetadata;
  clear(): void;
  private getClassFieldsByPredicate;
  private compileResolversMetadata;
  private compileFieldResolverMetadata;
  private compileExternalFieldResolverMetadata;
  private compileExtendedResolversMetadata;
  private isFieldDirectiveOrExtension;
  private mergeParentResolverHandlers;
  private mergeParentFieldHandlers;
}
export declare const TypeMetadataStorage: TypeMetadataStorageHost;

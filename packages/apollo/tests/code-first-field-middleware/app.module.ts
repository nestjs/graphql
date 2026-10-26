import {
  applyDecorators,
  CanActivate,
  DynamicModule,
  Injectable,
  Module,
  UseGuards,
} from '@nestjs/common';
import {
  Field,
  FieldMiddleware,
  GraphQLModule,
  ObjectType,
  Parent,
  PartialType,
  Query,
  ResolveField,
  Resolver,
  UseFieldMiddleware,
} from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

export const executionLog: string[] = [];

/**
 * Wraps the resolved value with the middleware name, so the response shows
 * the order in which middleware ran (outermost first).
 */
export const wrap =
  (name: string): FieldMiddleware =>
  async (_ctx, next) =>
    `${name}(${await next()})`;

const logged =
  (name: string): FieldMiddleware =>
  async (_ctx, next) => {
    executionLog.push(name);
    return next();
  };

@Injectable()
class LoggingGuard implements CanActivate {
  canActivate(): boolean {
    executionLog.push('guard');
    return true;
  }
}

function ComposedField() {
  return applyDecorators(Field(), UseFieldMiddleware(wrap('composed')));
}

@ObjectType()
export class Item {
  @UseFieldMiddleware(wrap('above'))
  @Field()
  above: string;

  @Field()
  @UseFieldMiddleware(wrap('below'))
  below: string;

  @Field({ middleware: [wrap('option')] })
  @UseFieldMiddleware(wrap('first'), wrap('second'))
  combined: string;

  @UseFieldMiddleware(wrap('upper'))
  @UseFieldMiddleware(wrap('lower'))
  @Field()
  stacked: string;

  @ComposedField()
  composed: string;

  @Field()
  plain: string;
}

@ObjectType()
export class PartialItem extends PartialType(Item, ObjectType) {}

const item = (): Item => ({
  above: 'value',
  below: 'value',
  combined: 'value',
  stacked: 'value',
  composed: 'value',
  plain: 'value',
});

@Resolver(() => Item)
export class ItemResolver {
  @Query(() => Item)
  item(): Item {
    return item();
  }

  @Query(() => PartialItem)
  partialItem(): PartialItem {
    return item();
  }

  @UseFieldMiddleware(wrap('above'))
  @ResolveField(() => String)
  resolvedAbove(@Parent() parent: Item): string {
    return 'value';
  }

  @ResolveField(() => String)
  @UseFieldMiddleware(wrap('below'))
  resolvedBelow(@Parent() parent: Item): string {
    return 'value';
  }

  @ResolveField(() => String, { middleware: [wrap('option')] })
  @UseFieldMiddleware(wrap('first'), wrap('second'))
  resolvedCombined(@Parent() parent: Item): string {
    return 'value';
  }

  // No parameters, no guards and no option middleware: without the decorator,
  // this field would be served by the fast field resolver path.
  @ResolveField(() => String)
  @UseFieldMiddleware(wrap('fast'))
  resolvedFast(): string {
    return 'value';
  }

  @ResolveField(() => String)
  @UseGuards(LoggingGuard)
  @UseFieldMiddleware(logged('middleware'))
  resolvedGuarded(@Parent() parent: Item): string {
    executionLog.push('resolver');
    return 'value';
  }
}

export interface FieldMiddlewareAppOptions {
  globalMiddleware?: boolean;
  fieldResolverEnhancers?: ApolloDriverConfig['fieldResolverEnhancers'];
}

@Module({})
export class FieldMiddlewareAppModule {
  static forRoot(options: FieldMiddlewareAppOptions = {}): DynamicModule {
    return {
      module: FieldMiddlewareAppModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          fieldResolverEnhancers: options.fieldResolverEnhancers,
          buildSchemaOptions: options.globalMiddleware
            ? { fieldMiddleware: [wrap('global')] }
            : undefined,
        }),
      ],
      providers: [ItemResolver, LoggingGuard],
    };
  }
}

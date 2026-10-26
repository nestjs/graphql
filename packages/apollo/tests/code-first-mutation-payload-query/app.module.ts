import { Module } from '@nestjs/common';
import {
  Args,
  Field,
  GraphQLModule,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '../../lib/index.js';

@ObjectType()
export class Todo {
  @Field()
  title!: string;
}

@ObjectType()
export class AddTodoPayload {
  @Field(() => Todo)
  todo!: Todo;

  @Field(() => 'Query')
  query!: object;
}

@Resolver()
export class TodosResolver {
  private readonly todos: Todo[] = [{ title: 'first' }];

  @Query(() => [Todo])
  todos(): Todo[] {
    return this.todos;
  }

  @Query(() => Number)
  todoCount(): number {
    return this.todos.length;
  }

  @Mutation(() => AddTodoPayload)
  addTodo(@Args('title') title: string): AddTodoPayload {
    const todo = { title };
    this.todos.push(todo);
    return { todo, query: {} };
  }
}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
  ],
  providers: [TodosResolver],
})
export class MutationPayloadQueryModule {}

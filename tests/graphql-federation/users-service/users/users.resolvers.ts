import {
  Args,
  Mutation,
  Query,
  Resolver,
  ResolveReference,
  Parent,
  ResolveProperty,
} from '../../../../lib';
import { UsersService } from './users.service';
import { User } from './users.interfaces';

@Resolver('User')
export class UsersResolvers {
  constructor(private readonly usersService: UsersService) {}

  @Query()
  getUser(@Args('id') id: string) {
    return this.usersService.findById(id);
  }

  @ResolveReference()
  resolveReference(reference: any) {
    return this.usersService.findById(reference.id);
  }
}

import { Injectable } from '@nestjs/common';
import { User } from './user.dto';
import { CreateUserInput } from './create-user.input';

@Injectable()
export class UserService {
  private users: User[] = [];
  private idCounter = 1;

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  create(createUserInput: CreateUserInput): User {
    const user: User = {
      id: String(this.idCounter++),
      name: createUserInput.name,
    };
    this.users.push(user);
    return user;
  }
}

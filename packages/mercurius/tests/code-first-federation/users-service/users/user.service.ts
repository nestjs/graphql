import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

const data = [
  {
    id: 1,
    name: 'foo',
  },
  {
    id: 2,
    name: 'bar',
  },
];

@Injectable()
export class UserService {
  public findOne(id: number) {
    const post = data.find((p) => p.id === id);
    if (post) {
      return new User(post);
    }
    return null;
  }

  public all() {
    return data.map((p) => new User(p));
  }
}

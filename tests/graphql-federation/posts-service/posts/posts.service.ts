import { Injectable } from '@nestjs/common';
import { Post } from './posts.interfaces';

@Injectable()
export class PostsService {
  private readonly posts: Post[] = [
    {
      id: '1',
      title: 'Hello world',
      body: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      userId: '5',
    },
  ];

  findAll() {
    return Promise.resolve(this.posts);
  }

  findById(id: string) {
    return Promise.resolve(this.posts.find(p => p.id === id));
  }

  findByUserId(id: string) {
    return Promise.resolve(this.posts.filter(p => p.userId === id));
  }
}

import { INestApplication } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ApplicationModule } from '../code-first-batch/app.module.js';
import { BlogService } from '../code-first-batch/blog.service.js';

describe('Code-first - @BatchResolveField', () => {
  let app: INestApplication;
  let blogService: BlogService;

  const executeQuery = async (query: string) => {
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.ready();
    return fastifyInstance.graphql(query);
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile();

    app = module.createNestApplication(new FastifyAdapter());
    await app.init();

    blogService = app.get(BlogService);
    blogService.reset();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('should resolve every parent with a single call to the batch method', async () => {
    const response = await executeQuery(`
      {
        posts {
          title
          author {
            name
          }
        }
      }
    `);

    expect(response.data).toEqual({
      posts: [
        { title: 'Post #1', author: { name: 'Kamil' } },
        { title: 'Post #2', author: { name: 'Kamil' } },
        { title: 'Post #3', author: { name: 'Manuel' } },
        { title: 'Post #4', author: { name: 'Manuel' } },
      ],
    });
    expect(blogService.batchCalls).toEqual([{ method: 'author', size: 4 }]);
  });

  it('should look the parents up by "keyBy" when the option is given', async () => {
    const response = await executeQuery(`
      {
        posts {
          title
          comments {
            text
          }
        }
      }
    `);

    expect(response.data).toEqual({
      posts: [
        {
          title: 'Post #1',
          comments: [{ text: 'Comment #1' }, { text: 'Comment #2' }],
        },
        { title: 'Post #2', comments: [] },
        { title: 'Post #3', comments: [{ text: 'Comment #3' }] },
        { title: 'Post #4', comments: [] },
      ],
    });
    expect(blogService.batchCalls).toEqual([{ method: 'comments', size: 4 }]);
  });

  it('should scope the loaders to a single request', async () => {
    const query = `
      {
        posts {
          author {
            name
          }
        }
      }
    `;

    await executeQuery(query);
    await executeQuery(query);

    expect(blogService.batchCalls).toEqual([
      { method: 'author', size: 4 },
      { method: 'author', size: 4 },
    ]);
  });
});

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Post } from '../code-first-batch/models/post.js';
import {
  CommentConnection,
  CommentEntity,
  CommentNode,
} from './models/comment-connection.js';

/**
 * Records what the interceptor observed, so the test can assert it ran once for
 * the whole batch rather than once per parent.
 */
@Injectable()
export class InterceptorCallsService {
  readonly batchSizes: number[] = [];

  reset() {
    this.batchSizes.length = 0;
  }
}

/** Stands in for a real object mapper (class-transformer, automapper, ...). */
@Injectable()
export class CommentMapper {
  async toNodes(entities: CommentEntity[]): Promise<CommentNode[]> {
    return entities.map((entity) => ({ id: entity.id, body: entity.text }));
  }
}

/**
 * Maps the output of a `@BatchResolveField()` method.
 *
 * Because enhancers sit inside the batch, `next.handle()` emits the value the
 * batch method returned - the whole `Map` keyed by parent - rather than one
 * parent's value. The interceptor rewrites every entry of that map, and the
 * rewritten map is what gets distributed back to the parents.
 */
@Injectable()
export class CommentsConnectionInterceptor implements NestInterceptor {
  constructor(
    private readonly mapper: CommentMapper,
    private readonly interceptorCalls: InterceptorCallsService,
  ) {}

  intercept(
    _context: ExecutionContext,
    next: CallHandler<Map<Post, CommentEntity[]>>,
  ): Observable<Map<Post, CommentConnection>> {
    return next.handle().pipe(
      concatMap(async (commentsByPost) => {
        this.interceptorCalls.batchSizes.push(commentsByPost.size);

        const connectionsByPost = new Map<Post, CommentConnection>();
        for (const [post, entities] of commentsByPost) {
          const nodes = await this.mapper.toNodes(entities);
          const byEntity = new Map(
            entities.map((entity, index) => [entity, nodes[index]]),
          );
          connectionsByPost.set(
            post,
            this.connectionOf(entities, (entity) => byEntity.get(entity)),
          );
        }
        return connectionsByPost;
      }),
    );
  }

  private connectionOf(
    entities: CommentEntity[],
    node: (entity: CommentEntity) => CommentNode,
  ): CommentConnection {
    const edges = entities.map((entity) => ({
      cursor: Buffer.from(entity.id).toString('base64'),
      node: node(entity),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: edges.length ? edges[0].cursor : null,
        endCursor: edges.length ? edges[edges.length - 1].cursor : null,
      },
      totalCount: entities.length,
    };
  }
}

import { ValidationPipe } from '@nestjs/common';
import { SerializedGraph } from '@nestjs/core/inspector/serialized-graph';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationModule } from '../code-first/app.module';

describe('Serialized graph', () => {
  let testingModule: TestingModule;

  beforeAll(async () => {
    testingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile({ snapshot: true });
  });

  it('should generate a pre-initialization graph and match snapshot', () => {
    const graph = testingModule.get(SerializedGraph);
    expect(JSON.parse(graph.toString())).toMatchSnapshot();
  });

  it('should generate a post-initialization graph and match snapshot', async () => {
    const app = testingModule.createNestApplication({ preview: false });
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const graph = testingModule.get(SerializedGraph);
    expect(graph.toString()).toMatchSnapshot();
  });
});

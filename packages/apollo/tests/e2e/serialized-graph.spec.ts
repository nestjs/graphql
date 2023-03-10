import { ValidationPipe } from '@nestjs/common';
import { Injector } from '@nestjs/core/injector/injector';
import { SerializedGraph } from '@nestjs/core/inspector/serialized-graph';
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationModule } from '../code-first/app.module';

describe('Serialized graph', () => {
  let testingModule: TestingModule;

  beforeAll(async () => {
    jest
      .spyOn(Injector.prototype as any, 'getNowTimestamp')
      .mockImplementation(() => 0);

    testingModule = await Test.createTestingModule({
      imports: [ApplicationModule],
    }).compile({ snapshot: true, preview: true });
  });

  it('should generate a post-initialization graph and match snapshot', async () => {
    const app = testingModule.createNestApplication({ preview: true });
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const graph = testingModule.get(SerializedGraph);
    expect(graph.toString()).toMatchSnapshot();
  });
});

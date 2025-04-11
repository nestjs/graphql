import { ApolloServerPlugin } from '@apollo/server';
import { GraphiQLHTMLFactory } from './graphiql-html.factory';
import { GraphiQLOptions } from './interfaces/graphiql-options.interface';

export class GraphiQLPlaygroundPlugin implements ApolloServerPlugin {
  private readonly graphiqlHTMLFactory = new GraphiQLHTMLFactory();

  constructor(private readonly options: GraphiQLOptions) {}

  async serverWillStart() {
    const html = this.graphiqlHTMLFactory.create(this.options);
    return {
      async renderLandingPage() {
        return { html };
      },
    };
  }
}

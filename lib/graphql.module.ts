import { Module, DynamicModule } from '@nestjs/common';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';

import { GraphQLFactory } from './graphql.factory';
import { ResolversExplorerService } from './resolvers-explorer.service';

@Module({
	components: [
		GraphQLFactory,
		MetadataScanner,
		ResolversExplorerService,
	],
	exports: [GraphQLFactory, ResolversExplorerService],
})
export class GraphQLModule {}

import { resolve } from 'path';
import { register } from 'tsconfig-paths';

// Register tsconfig paths for globalSetup context
// Jest's moduleNameMapper doesn't apply to globalSetup, so we need this
const tsConfig = require('../../tsconfig.spec.json');
register({
  baseUrl: resolve(__dirname, '../..'),
  paths: tsConfig.compilerOptions.paths,
});

/**
 * Jest globalSetup function that initializes the app first.
 * This runs in a separate VM context from the test files.
 *
 * The issue: When this globalSetup initializes the app,
 * the @Field() decorators capture the String/Number/Boolean
 * references from this VM context. Later, when test files
 * run in a different VM context, the TypeMapperService
 * creates a Map with their own String/Number/Boolean references.
 * Since Map uses strict equality (===) for key lookup, the
 * lookup fails because globalSetup's String !== test's String.
 */
export default async function globalSetup() {
  console.log('\n=== Global Setup: Initializing app first time ===');
  console.log('globalSetup String reference:', String);

  // Dynamic imports after tsconfig-paths is registered
  const { Test } = await import('@nestjs/testing');
  const { GlobalSetupIssueModule } = await import('./app.module');

  const moduleFixture = await Test.createTestingModule({
    imports: [GlobalSetupIssueModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  await app.close();

  console.log('=== Global Setup: App closed ===\n');
}

/**
 * When code is downleveled to CommonJs imports typescript will try to remove all imports
 * which lead to only a type. In this case we should re-create imports in the transform.
 *
 * Another problem might be if one ModelA uses ModelB and file
 * containing the latest is not referenced anywhere else.
 * In this case ModelA will reference in schema ModelB but ModelB
 * will never appear in runtime code hence will never be executed and registered.
 *
 * For this case we create an 'eager' import in the begining of the file to make
 * sure all types used in metadata is loaded into runtime
 */

import { Author } from './author.model';

declare const ObjectType: any;

@ObjectType()
export class Post {
  author: Author;
}

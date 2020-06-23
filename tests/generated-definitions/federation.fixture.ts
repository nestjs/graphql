
/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export enum Category {
    POST = "POST"
}

export class Post {
    id: string;
    title: string;
    author: User;
    category: Category;
}

export abstract class IQuery {
    abstract getPosts(): Post[] | Promise<Post[]>;
}

export class User {
    id: string;
    posts?: Post[];
}

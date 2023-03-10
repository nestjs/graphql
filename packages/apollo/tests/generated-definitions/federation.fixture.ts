
/*
 * -------------------------------------------------------
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
    abstract getPosts(): Nullable<Nullable<Post>[]> | Promise<Nullable<Nullable<Post>[]>>;
}

export class User {
    id: string;
    posts?: Nullable<Nullable<Post>[]>;
}

export type _FieldSet = any;
type Nullable<T> = T | null;

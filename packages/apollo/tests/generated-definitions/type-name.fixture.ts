
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum UserRoleSchema {
    ADMIN = "ADMIN",
    USER = "USER",
    GUEST = "GUEST"
}

export interface CreateUserInputSchema {
    name: string;
    email: string;
    role: UserRoleSchema;
}

export interface UserSchema {
    id: string;
    name: string;
    email: string;
    role: UserRoleSchema;
    profile?: Nullable<ProfileSchema>;
}

export interface ProfileSchema {
    bio?: Nullable<string>;
    avatar?: Nullable<string>;
}

export interface IQuery {
    user(id: string): Nullable<UserSchema> | Promise<Nullable<UserSchema>>;
    searchUsers(query: string): SearchResultSchema[] | Promise<SearchResultSchema[]>;
}

export interface IMutation {
    createUser(input: CreateUserInputSchema): UserSchema | Promise<UserSchema>;
}

export type DateTimeSchema = any;
export type SearchResultSchema = UserSchema | ProfileSchema;
type Nullable<T> = T | null;

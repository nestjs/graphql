
/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */
export interface Cat {
    id: number;
}

export interface IMutation {
    createCat(name?: string): Cat | Promise<Cat>;
    returnsQuery(): IQuery | Promise<IQuery>;
}

export interface IQuery {
    query(): number | Promise<number>;
}

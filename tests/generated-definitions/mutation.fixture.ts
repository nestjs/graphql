
/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
export interface Cat {
    id: number;
}

export interface IMutation {
    createCat(name?: string): Cat | Promise<Cat>;
}

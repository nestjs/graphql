/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
export interface Cat {
  id: number;
}

export interface IQuery {
  cat(id: string): Cat | Promise<Cat>;
}

export interface GraphQLDriver<TOptions = any> {
  start(options: TOptions): Promise<unknown>;
  stop(): Promise<void>;
}

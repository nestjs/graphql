export declare type TargetHost = Record<'target', Function>;
export declare function isTargetEqual<
  T extends TargetHost,
  U extends TargetHost
>(a: T, b: U): boolean;

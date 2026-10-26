import * as ts from 'typescript';
import { PluginOptions } from '../merge-options.js';

/**
 * Resolves the plugin options for a given source file, inferring whether the
 * emitted file will be an ES module (unless the user configured it explicitly).
 */
export function resolvePluginOptionsForFile(
  options: PluginOptions,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
): PluginOptions {
  return {
    ...options,
    esmCompatible: isEsmOutputFile(sourceFile, compilerOptions, options),
    esmCompatibleWasConfigured: true,
  };
}

export function isEsmOutputFile(
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
  options?: PluginOptions,
): boolean {
  if (options?.esmCompatibleWasConfigured) {
    return !!options.esmCompatible;
  }
  if (sourceFile.impliedNodeFormat !== undefined) {
    return sourceFile.impliedNodeFormat === ts.ModuleKind.ESNext;
  }
  const impliedNodeFormat = getImpliedNodeFormat(sourceFile, compilerOptions);
  if (impliedNodeFormat !== undefined) {
    return impliedNodeFormat === ts.ModuleKind.ESNext;
  }
  return isEsmModuleKind(compilerOptions.module);
}

const impliedNodeFormatCache = new Map<string, ts.ResolutionMode | undefined>();

function getImpliedNodeFormat(
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
): ts.ResolutionMode | undefined {
  if (!isNodeModuleKind(compilerOptions.module)) {
    return undefined;
  }
  const cacheKey = sourceFile.fileName;
  if (impliedNodeFormatCache.has(cacheKey)) {
    return impliedNodeFormatCache.get(cacheKey);
  }
  const impliedNodeFormat = ts.getImpliedNodeFormatForFile(
    sourceFile.fileName as any,
    undefined,
    ts.sys,
    compilerOptions,
  );
  impliedNodeFormatCache.set(cacheKey, impliedNodeFormat);
  return impliedNodeFormat;
}

function isEsmModuleKind(moduleKind: ts.ModuleKind | undefined): boolean {
  if (moduleKind === undefined) {
    return false;
  }
  return (
    (moduleKind >= ts.ModuleKind.ES2015 &&
      moduleKind <= ts.ModuleKind.ESNext) ||
    moduleKind === ts.ModuleKind.Preserve
  );
}

function isNodeModuleKind(moduleKind: ts.ModuleKind | undefined): boolean {
  if (moduleKind === undefined) {
    return false;
  }
  const nodeModuleKinds = [
    ts.ModuleKind.Node16,
    (ts.ModuleKind as Record<string, any>).Node18,
    (ts.ModuleKind as Record<string, any>).Node20,
    ts.ModuleKind.NodeNext,
  ];
  return nodeModuleKinds.includes(moduleKind);
}

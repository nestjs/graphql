import { flattenDeep, groupBy, identity, mapValues } from 'lodash';
import { ResolverMetadata } from '../interfaces/resolver-metadata.interface';

export class BaseExplorerService {
  flatMap<T = ResolverMetadata[]>(
    modules: Map<any, any>[],
    callback: (instance: any) => T,
  ) {
    return flattenDeep(
      modules.map(module =>
        [...module.values()].map(({ instance }) => callback(instance)),
      ),
    ).filter(identity);
  }

  groupMetadata(resolvers: ResolverMetadata[]) {
    const groupByType = groupBy(resolvers, metadata => metadata.type);
    return mapValues(groupByType, resolversArr =>
      resolversArr.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.name]: curr.callback,
        };
      }, {}),
    );
  }
}

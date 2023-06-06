import { METADATA_FACTORY_NAME } from './plugin-constants';

export class MetadataLoader {
  async load(metadata: Record<string, any>) {
    const pkgMetadata = metadata['@nestjs/graphql'];
    if (!pkgMetadata) {
      return;
    }
    const { models } = pkgMetadata;
    if (models) {
      await this.applyMetadata(models);
    }
  }

  private async applyMetadata(meta: Record<string, any>) {
    const loadPromises = meta.map(async ([fileImport, fileMeta]) => {
      const fileRef = await fileImport;
      Object.keys(fileMeta).map((key) => {
        const clsRef = fileRef[key];
        clsRef[METADATA_FACTORY_NAME] = () => fileMeta[key];
      });
    });
    await Promise.all(loadPromises);
  }
}

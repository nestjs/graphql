"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionTypeFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const type_metadata_storage_1 = require("../storages/type-metadata.storage");
const root_type_factory_1 = require("./root-type.factory");
let SubscriptionTypeFactory = (() => {
    let SubscriptionTypeFactory = class SubscriptionTypeFactory {
        constructor(rootTypeFactory) {
            this.rootTypeFactory = rootTypeFactory;
        }
        create(typeRefs, options) {
            const objectTypeName = 'Subscription';
            const subscriptionsMetadata = type_metadata_storage_1.TypeMetadataStorage.getSubscriptionsMetadata();
            return this.rootTypeFactory.create(typeRefs, subscriptionsMetadata, objectTypeName, options);
        }
    };
    SubscriptionTypeFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [root_type_factory_1.RootTypeFactory])
    ], SubscriptionTypeFactory);
    return SubscriptionTypeFactory;
})();
exports.SubscriptionTypeFactory = SubscriptionTypeFactory;

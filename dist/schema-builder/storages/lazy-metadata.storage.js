"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyMetadataStorage = exports.LazyMetadataStorageHost = void 0;
const common_1 = require("@nestjs/common");
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
class LazyMetadataStorageHost {
    constructor() {
        this.storage = new Array();
    }
    store(targetOrFn, func) {
        if (func) {
            this.storage.push({ target: targetOrFn, func });
        }
        else {
            this.storage.push({ func: targetOrFn });
        }
    }
    load(types = []) {
        types = this.concatPrototypes(types);
        this.storage.forEach(({ func, target }) => {
            if (target && types.includes(target)) {
                func();
            }
            else if (!target) {
                func();
            }
        });
    }
    concatPrototypes(types) {
        const typesWithPrototypes = types
            .filter((type) => type && type.prototype)
            .map((type) => {
            const parentTypes = [];
            let parent = type;
            while (!shared_utils_1.isUndefined(parent.prototype)) {
                parent = Object.getPrototypeOf(parent);
                if (parent === Function.prototype) {
                    break;
                }
                parentTypes.push(parent);
            }
            parentTypes.push(type);
            return parentTypes;
        });
        return common_1.flatten(typesWithPrototypes);
    }
}
exports.LazyMetadataStorageHost = LazyMetadataStorageHost;
const globalRef = global;
exports.LazyMetadataStorage = globalRef.GqlLazyMetadataStorageHost ||
    (globalRef.GqlLazyMetadataStorageHost = new LazyMetadataStorageHost());

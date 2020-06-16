"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectType = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const class_type_enum_1 = require("../enums/class-type.enum");
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
const add_class_type_metadata_util_1 = require("../utils/add-class-type-metadata.util");
function ObjectType(nameOrOptions, objectTypeOptions) {
    const [name, options = {}] = shared_utils_1.isString(nameOrOptions)
        ? [nameOrOptions, objectTypeOptions]
        : [undefined, nameOrOptions];
    const interfaces = options.implements
        ? [].concat(options.implements)
        : undefined;
    return (target) => {
        const addObjectTypeMetadata = () => type_metadata_storage_1.TypeMetadataStorage.addObjectTypeMetadata({
            name: name || target.name,
            target,
            description: options.description,
            interfaces,
            isAbstract: options.isAbstract,
        });
        addObjectTypeMetadata();
        lazy_metadata_storage_1.LazyMetadataStorage.store(addObjectTypeMetadata);
        add_class_type_metadata_util_1.addClassTypeMetadata(target, class_type_enum_1.ClassType.OBJECT);
    };
}
exports.ObjectType = ObjectType;

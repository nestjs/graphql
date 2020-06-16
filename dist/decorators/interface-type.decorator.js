"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterfaceType = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const class_type_enum_1 = require("../enums/class-type.enum");
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
const add_class_type_metadata_util_1 = require("../utils/add-class-type-metadata.util");
function InterfaceType(nameOrOptions, interfaceOptions) {
    const [name, options = {}] = shared_utils_1.isString(nameOrOptions)
        ? [nameOrOptions, interfaceOptions]
        : [undefined, nameOrOptions];
    return (target) => {
        const metadata = Object.assign({ name: name || target.name, target }, options);
        lazy_metadata_storage_1.LazyMetadataStorage.store(() => type_metadata_storage_1.TypeMetadataStorage.addInterfaceMetadata(metadata));
        add_class_type_metadata_util_1.addClassTypeMetadata(target, class_type_enum_1.ClassType.INTERFACE);
    };
}
exports.InterfaceType = InterfaceType;

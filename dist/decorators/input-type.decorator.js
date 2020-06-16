"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputType = void 0;
const shared_utils_1 = require("@nestjs/common/utils/shared.utils");
const class_type_enum_1 = require("../enums/class-type.enum");
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
const add_class_type_metadata_util_1 = require("../utils/add-class-type-metadata.util");
function InputType(nameOrOptions, inputTypeOptions) {
    const [name, options = {}] = shared_utils_1.isString(nameOrOptions)
        ? [nameOrOptions, inputTypeOptions]
        : [undefined, nameOrOptions];
    return (target) => {
        const metadata = {
            target,
            name: name || target.name,
            description: options.description,
            isAbstract: options.isAbstract,
        };
        lazy_metadata_storage_1.LazyMetadataStorage.store(() => type_metadata_storage_1.TypeMetadataStorage.addInputTypeMetadata(metadata));
        add_class_type_metadata_util_1.addClassTypeMetadata(target, class_type_enum_1.ClassType.INPUT);
    };
}
exports.InputType = InputType;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Directive = void 0;
const graphql_1 = require("graphql");
const directive_parsing_error_1 = require("../schema-builder/errors/directive-parsing.error");
const lazy_metadata_storage_1 = require("../schema-builder/storages/lazy-metadata.storage");
const type_metadata_storage_1 = require("../schema-builder/storages/type-metadata.storage");
function Directive(sdl) {
    return (target, key) => {
        validateDirective(sdl);
        lazy_metadata_storage_1.LazyMetadataStorage.store(() => {
            if (key) {
                type_metadata_storage_1.TypeMetadataStorage.addDirectivePropertyMetadata({
                    target: target.constructor,
                    fieldName: key,
                    sdl,
                });
            }
            else {
                type_metadata_storage_1.TypeMetadataStorage.addDirectiveMetadata({
                    target: target,
                    sdl,
                });
            }
        });
    };
}
exports.Directive = Directive;
function validateDirective(sdl) {
    try {
        graphql_1.parse(`type String ${sdl}`);
    }
    catch (err) {
        throw new directive_parsing_error_1.DirectiveParsingError(sdl);
    }
}

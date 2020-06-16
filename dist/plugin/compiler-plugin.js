"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.before = void 0;
const merge_options_1 = require("./merge-options");
const model_class_visitor_1 = require("./visitors/model-class.visitor");
const typeClassVisitor = new model_class_visitor_1.ModelClassVisitor();
const isFilenameMatched = (patterns, filename) => patterns.some(path => filename.includes(path));
exports.before = (options, program) => {
    options = merge_options_1.mergePluginOptions(options);
    return (ctx) => {
        return (sf) => {
            if (isFilenameMatched(options.typeFileNameSuffix, sf.fileName)) {
                return typeClassVisitor.visit(sf, ctx, program);
            }
            return sf;
        };
    };
};

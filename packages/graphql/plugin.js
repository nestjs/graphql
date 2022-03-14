'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const tslib_1 = require('tslib');
const plugin = require('./dist/plugin');
(0, tslib_1.__exportStar)(plugin, exports);

/** Compatibility with ts-patch/ttypescript */
exports.default = (program, options) => plugin.before(options, program);

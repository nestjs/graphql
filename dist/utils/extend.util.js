"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extend = void 0;
const lodash_1 = require("lodash");
function extend(obj1, obj2) {
    if (lodash_1.isString(obj1)) {
        return lodash_1.isString(obj2)
            ? [lodash_1.defaultTo(obj1, ''), lodash_1.defaultTo(obj2, '')]
            : [lodash_1.defaultTo(obj1, '')].concat(lodash_1.defaultTo(obj2, []));
    }
    if (lodash_1.isArray(obj1)) {
        return lodash_1.defaultTo(obj1, []).concat(lodash_1.defaultTo(obj2, []));
    }
    return Object.assign(Object.assign({}, (obj1 || {})), (obj2 || {}));
}
exports.extend = extend;

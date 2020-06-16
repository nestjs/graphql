"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAsyncIterator = void 0;
const tslib_1 = require("tslib");
const iterall_1 = require("iterall");
exports.createAsyncIterator = (lazyFactory, filterFn) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const asyncIterator = yield lazyFactory;
    const getNextValue = () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        if (!asyncIterator || typeof asyncIterator.next !== 'function') {
            return Promise.reject(asyncIterator);
        }
        const payload = yield asyncIterator.next();
        if (payload.done === true) {
            return payload;
        }
        return Promise.resolve(filterFn(payload.value))
            .catch(() => false)
            .then(result => (result ? payload : getNextValue()));
    });
    return {
        next() {
            return getNextValue();
        },
        return() {
            const isAsyncIterator = asyncIterator && typeof asyncIterator.return === 'function';
            return isAsyncIterator
                ? asyncIterator.return()
                : Promise.resolve({
                    done: true,
                    value: asyncIterator,
                });
        },
        throw(error) {
            return asyncIterator.throw(error);
        },
        [iterall_1.$$asyncIterator]() {
            return this;
        },
    };
});

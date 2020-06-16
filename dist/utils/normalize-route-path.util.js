"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRoutePath = void 0;
function addStartingSlash(text) {
    if (!text) {
        return text;
    }
    return text[0] !== '/' ? '/' + text : text;
}
function stripEndingSlash(text) {
    if (!text) {
        return text;
    }
    return text[text.length - 1] === '/' && text.length > 1
        ? text.slice(0, text.length - 1)
        : text;
}
function normalizeRoutePath(path) {
    path = addStartingSlash(path);
    return stripEndingSlash(path);
}
exports.normalizeRoutePath = normalizeRoutePath;

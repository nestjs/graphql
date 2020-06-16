"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemHelper = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path_1 = require("path");
let FileSystemHelper = (() => {
    let FileSystemHelper = class FileSystemHelper {
        writeFile(path, content) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                try {
                    yield fs.promises.writeFile(path, content);
                }
                catch (err) {
                    if (err.code !== 'ENOENT') {
                        throw err;
                    }
                    yield this.mkdirRecursive(path);
                    yield fs.promises.writeFile(path, content);
                }
            });
        }
        mkdirRecursive(path) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                for (const dir of this.getDirs(path)) {
                    try {
                        yield fs.promises.mkdir(dir);
                    }
                    catch (err) {
                        if (err.code !== 'EEXIST') {
                            throw err;
                        }
                    }
                }
            });
        }
        getDirs(path) {
            const parsedPath = path_1.parse(path_1.resolve(path));
            const chunks = parsedPath.dir.split(path_1.sep);
            if (parsedPath.root === '/') {
                chunks[0] = `/${chunks[0]}`;
            }
            const dirs = new Array();
            chunks.reduce((previous, next) => {
                const directory = path_1.join(previous, next);
                dirs.push(directory);
                return path_1.join(directory);
            });
            return dirs;
        }
    };
    FileSystemHelper = tslib_1.__decorate([
        common_1.Injectable()
    ], FileSystemHelper);
    return FileSystemHelper;
})();
exports.FileSystemHelper = FileSystemHelper;

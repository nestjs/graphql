"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const config_1 = require("vitest/config");
const path_1 = tslib_1.__importDefault(require("path"));
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.spec.ts'],
        root: '.',
        alias: {
            '@nestjs/graphql': path_1.default.resolve(__dirname, '../graphql/lib'),
            '@nestjs/graphql/(.*)': path_1.default.resolve(__dirname, '../graphql/lib/$1'),
        },
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
    },
});

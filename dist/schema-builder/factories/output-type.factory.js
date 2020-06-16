"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutputTypeFactory = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const cannot_determine_output_type_error_1 = require("../errors/cannot-determine-output-type.error");
const type_mapper_service_1 = require("../services/type-mapper.service");
const type_definitions_storage_1 = require("../storages/type-definitions.storage");
let OutputTypeFactory = (() => {
    let OutputTypeFactory = class OutputTypeFactory {
        constructor(typeDefinitionsStorage, typeMapperService) {
            this.typeDefinitionsStorage = typeDefinitionsStorage;
            this.typeMapperService = typeMapperService;
        }
        create(hostType, typeRef, buildOptions, typeOptions = {}) {
            let gqlType = this.typeMapperService.mapToScalarType(typeRef, buildOptions.scalarsMap, buildOptions.dateScalarMode);
            if (!gqlType) {
                gqlType = this.typeDefinitionsStorage.getOutputTypeAndExtract(typeRef);
                if (!gqlType) {
                    throw new cannot_determine_output_type_error_1.CannotDetermineOutputTypeError(hostType);
                }
            }
            return this.typeMapperService.mapToGqlType(hostType, gqlType, typeOptions, false);
        }
    };
    OutputTypeFactory = tslib_1.__decorate([
        common_1.Injectable(),
        tslib_1.__metadata("design:paramtypes", [type_definitions_storage_1.TypeDefinitionsStorage,
            type_mapper_service_1.TypeMapperSevice])
    ], OutputTypeFactory);
    return OutputTypeFactory;
})();
exports.OutputTypeFactory = OutputTypeFactory;

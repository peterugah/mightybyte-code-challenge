"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomHttpCodes = void 0;
/**
 * This enum defines internal http codes for the project
 */
var CustomHttpCodes;
(function (CustomHttpCodes) {
    CustomHttpCodes[CustomHttpCodes["TOKEN_EXPIRED"] = 600] = "TOKEN_EXPIRED";
    CustomHttpCodes[CustomHttpCodes["REFRESH_TOKEN_EXPIRED"] = 601] = "REFRESH_TOKEN_EXPIRED";
})(CustomHttpCodes || (exports.CustomHttpCodes = CustomHttpCodes = {}));

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("../app"));
describe('Backend Application Tests', () => {
    it('should initialize application', () => {
        expect(app_1.default).toBeDefined();
    });
});

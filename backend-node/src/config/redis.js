"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.connectRedis = connectRedis;
exports.ensureRedisConnected = ensureRedisConnected;
const redis_1 = require("redis");
// Use environment variables for Redis connection details
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
    console.warn('REDIS_URL environment variable is not set. Redis features will be unavailable.');
}
const redisClient = redisUrl ? (0, redis_1.createClient)({ url: redisUrl }) : null;
exports.redisClient = redisClient;
if (redisClient) {
    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
}
// Function to initiate connection
function connectRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!redisClient) {
            console.log('Redis client not configured. Skipping connection.');
            return;
        }
        try {
            yield redisClient.connect();
            console.log('Redis client connected successfully.');
        }
        catch (err) {
            console.error('Failed to connect to Redis on startup:', err);
            // Don't exit, just log the error. The app can proceed without Redis.
        }
    });
}
/**
 * Ensures Redis is connected before use.
 * This is crucial for serverless environments where connections aren't persisted.
 * In serverless, each invocation may be a new instance, so we need to connect on-demand.
 */
function ensureRedisConnected() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!redisClient) {
            return false;
        }
        // If already connected, return true
        if (redisClient.isReady) {
            return true;
        }
        // Try to connect if not ready
        try {
            if (!redisClient.isOpen) {
                yield redisClient.connect();
                console.log('Redis client connected on-demand.');
            }
            return redisClient.isReady;
        }
        catch (err) {
            console.error('Failed to connect to Redis on-demand:', err);
            return false;
        }
    });
}

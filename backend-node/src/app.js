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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from .env file
console.log('Backend App Starting...'); // Add this line for testing
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const MovieController_1 = require("./controllers/MovieController");
const redis_1 = require("./config/redis"); // Import the connect function
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Simple request logger middleware (before specific routes)
app.use((req, res, next) => {
    console.log(`[App] Received request: ${req.method} ${req.url}`);
    next(); // Pass control to the next middleware/route handler
});
// Routes
app.get('/api/movies/cinematheque', MovieController_1.MovieController.getCinemathequeMovies);
app.get('/api/movies/cinematheque/refresh', MovieController_1.MovieController.forceRefreshCinemathequeMovies);
app.get('/api/movies/delete-cache', MovieController_1.MovieController.deleteCache);
// Hello World endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Hello World!' });
});
// Start the server only if this script is run directly
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        // Attempt to connect to Redis before starting the server
        yield (0, redis_1.connectRedis)();
        const port = process.env.PORT || 3000;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    });
}
if (require.main === module) {
    startServer().catch(error => {
        console.error("Failed to start server:", error);
        process.exit(1); // Optionally exit if server setup fails critically
    });
}
// Export the Express app for Vercel
exports.default = app;

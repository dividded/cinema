/**
 * Logger utility for consistent logging across the application.
 * Adds timestamps, file context, and log levels.
 * Works seamlessly with Vercel's logging infrastructure.
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private moduleName: string;
  private static globalLogLevel: LogLevel = LogLevel.INFO;

  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }

  /**
   * Set the global log level. Logs below this level won't be output.
   * Can be configured via LOG_LEVEL environment variable.
   */
  static setLogLevel(level: LogLevel): void {
    Logger.globalLogLevel = level;
  }

  /**
   * Initialize logger from environment variables
   */
  static initialize(): void {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        Logger.setLogLevel(LogLevel.DEBUG);
        break;
      case 'INFO':
        Logger.setLogLevel(LogLevel.INFO);
        break;
      case 'WARN':
        Logger.setLogLevel(LogLevel.WARN);
        break;
      case 'ERROR':
        Logger.setLogLevel(LogLevel.ERROR);
        break;
      default:
        // Default to INFO in production, DEBUG in development
        Logger.setLogLevel(
          process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
        );
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] [${this.moduleName}] ${message}${formattedArgs}`;
  }

  /**
   * Debug level logging - for detailed diagnostic information
   */
  debug(message: string, ...args: any[]): void {
    if (Logger.globalLogLevel <= LogLevel.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, ...args));
    }
  }

  /**
   * Info level logging - for general informational messages
   */
  info(message: string, ...args: any[]): void {
    if (Logger.globalLogLevel <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message, ...args));
    }
  }

  /**
   * Warning level logging - for warning messages
   */
  warn(message: string, ...args: any[]): void {
    if (Logger.globalLogLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, ...args));
    }
  }

  /**
   * Error level logging - for error messages
   */
  error(message: string, ...args: any[]): void {
    if (Logger.globalLogLevel <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, ...args));
    }
  }

  /**
   * Log an error object with stack trace
   */
  errorWithStack(message: string, error: Error): void {
    this.error(message, error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Initialize logger on module load
Logger.initialize();

/**
 * Create a logger instance for a specific module
 * @param moduleName The name of the module (usually the file name)
 */
export function createLogger(moduleName: string): Logger {
  return new Logger(moduleName);
}


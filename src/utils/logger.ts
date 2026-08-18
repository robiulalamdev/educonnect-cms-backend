import pino, { Logger, LoggerOptions } from 'pino';
import pinoPretty from 'pino-pretty';
import path from 'path';
import { env } from '../config/env.js';

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LogContext {
  [key: string]: any;
  reqId?: string;
  userId?: string;
  userRole?: string;
  ip?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
}

class AppLogger {
  private logger: Logger;
  private static instance: AppLogger;

  private constructor() {
    const isProduction = env.NODE_ENV === 'production';
    const isDevelopment = env.NODE_ENV === 'development';

    const options: LoggerOptions = {
      level: isProduction ? 'info' : 'debug',
      base: {
        pid: process.pid,
        hostname: process.env.HOSTNAME ?? 'localhost',
        env: env.NODE_ENV,
        version: process.env.npm_package_version ?? '1.0.0',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
        log: (object) => {
          // Remove sensitive fields
          const { password, token, refreshToken, accessToken, authorization, cookie, ...rest } = object;
          return rest;
        },
      },
      serializers: {
        err: pino.stdSerializers.err,
        req: (req: any) => ({
          method: req.method,
          url: req.url,
          headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
          },
          remoteAddress: req.ip,
          remotePort: req.socket?.remotePort,
        }),
        res: (res: any) => ({
          statusCode: res.statusCode,
        }),
      },
    };

    if (isDevelopment) {
      // Pretty print in development
      const prettyStream = pinoPretty({
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        messageFormat: '{context} {msg}',
      });
      this.logger = pino(options, prettyStream);
    } else {
      // File rotation in production
      this.logger = pino(
        {
          ...options,
          transport: {
            target: 'pino-roll',
            options: {
              file: path.join(process.cwd(), 'logs', 'app'),
              frequency: 'daily',
              dateFormat: 'yyyy-MM-dd',
              extension: '.log',
              mkdir: true,
              size: '10m',
              maxFiles: '30d',
            },
          },
        },
      );
    }
  }

  public static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger();
    }
    return AppLogger.instance;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  // Convenience methods with context
  fatal(message: string, context?: LogContext) {
    this.logger.fatal(context, message);
  }

  error(message: string, context?: LogContext | Error) {
    if (context instanceof Error) {
      this.logger.error({ err: context }, message);
    } else {
      this.logger.error(context, message);
    }
  }

  warn(message: string, context?: LogContext) {
    this.logger.warn(context, message);
  }

  info(message: string, context?: LogContext) {
    this.logger.info(context, message);
  }

  debug(message: string, context?: LogContext) {
    this.logger.debug(context, message);
  }

  trace(message: string, context?: LogContext) {
    this.logger.trace(context, message);
  }

  // Structured logging helpers
  logRequest(req: any, res: any, responseTime: number) {
    const context: LogContext = {
      reqId: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role,
      statusCode: res.statusCode,
      responseTime,
    };

    if (res.statusCode >= 500) {
      this.error('HTTP Request Error', context);
    } else if (res.statusCode >= 400) {
      this.warn('HTTP Request Client Error', context);
    } else {
      this.info('HTTP Request', context);
    }
  }

  logAuth(event: 'login' | 'logout' | 'register' | 'refresh' | 'failed', context: LogContext) {
    this.info(`Auth: ${event}`, { ...context, authEvent: event });
  }

  logDatabase(operation: string, context: LogContext & { duration?: number; error?: Error }) {
    if (context.error) {
      this.error(`Database: ${operation} failed`, { ...context, err: context.error });
    } else if (context.duration && context.duration > 1000) {
      this.warn(`Database: ${operation} slow`, { ...context, dbOperation: operation });
    } else {
      this.debug(`Database: ${operation}`, { ...context, dbOperation: operation });
    }
  }

  logExternalService(service: string, operation: string, context: LogContext & { duration?: number; error?: Error }) {
    if (context.error) {
      this.error(`External Service: ${service}.${operation} failed`, { ...context, err: context.error });
    } else if (context.duration && context.duration > 5000) {
      this.warn(`External Service: ${service}.${operation} slow`, { ...context });
    } else {
      this.info(`External Service: ${service}.${operation}`, { ...context });
    }
  }

  logBusinessEvent(event: string, context: LogContext) {
    this.info(`Business Event: ${event}`, { ...context, businessEvent: event });
  }

  logSecurity(event: string, context: LogContext & { severity?: 'low' | 'medium' | 'high' | 'critical' }) {
    const level = context.severity ?? 'medium';
    this[level](`Security: ${event}`, { ...context, securityEvent: event });
  }

  // Child logger with bound context
  child(context: LogContext): Logger {
    return this.logger.child(context);
  }
}

// Export singleton instance
export const logger = AppLogger.getInstance().getLogger();

// Export class for advanced usage
export { AppLogger };

// Convenience functions
export const log = {
  fatal: (message: string, context?: LogContext) => AppLogger.getInstance().fatal(message, context),
  error: (message: string, context?: LogContext | Error) => AppLogger.getInstance().error(message, context),
  warn: (message: string, context?: LogContext) => AppLogger.getInstance().warn(message, context),
  info: (message: string, context?: LogContext) => AppLogger.getInstance().info(message, context),
  debug: (message: string, context?: LogContext) => AppLogger.getInstance().debug(message, context),
  trace: (message: string, context?: LogContext) => AppLogger.getInstance().trace(message, context),
  
  request: (req: any, res: any, responseTime: number) => AppLogger.getInstance().logRequest(req, res, responseTime),
  auth: (event: 'login' | 'logout' | 'register' | 'refresh' | 'failed', context: LogContext) => AppLogger.getInstance().logAuth(event, context),
  db: (operation: string, context: LogContext & { duration?: number; error?: Error }) => AppLogger.getInstance().logDatabase(operation, context),
  external: (service: string, operation: string, context: LogContext & { duration?: number; error?: Error }) => AppLogger.getInstance().logExternalService(service, operation, context),
  business: (event: string, context: LogContext) => AppLogger.getInstance().logBusinessEvent(event, context),
  security: (event: string, context: LogContext & { severity?: 'low' | 'medium' | 'high' | 'critical' }) => AppLogger.getInstance().logSecurity(event, context),
};
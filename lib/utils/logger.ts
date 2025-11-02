/**
 * Structured logging utility
 * Prevents sensitive data leaks in production
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

const isDevelopment = process.env.NODE_ENV === 'development'

class Logger {
  private log(level: LogLevel, ...args: any[]) {
    if (isDevelopment) {
      console[level](...args)
    } else if (level === 'error' || level === 'warn') {
      // In production, only log errors and warnings
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      console[level](...args)
    }
  }

  /**
   * General logging - only in development
   */
  info(...args: any[]) {
    this.log('log', '[INFO]', ...args)
  }

  /**
   * Warning messages
   */
  warn(...args: any[]) {
    this.log('warn', '[WARN]', ...args)
  }

  /**
   * Error logging - always logged
   */
  error(...args: any[]) {
    this.log('error', '[ERROR]', ...args)
  }

  /**
   * Debug logging - only in development
   */
  debug(...args: any[]) {
    this.log('debug', '[DEBUG]', ...args)
  }

  /**
   * Log API requests - sanitized
   */
  apiRequest(method: string, path: string, userId?: string) {
    if (isDevelopment) {
      this.info(`API ${method} ${path}`, userId ? `User: ${userId}` : '')
    }
  }

  /**
   * Log API errors - sanitized
   */
  apiError(method: string, path: string, error: unknown, userId?: string) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    this.error(`API ${method} ${path} failed:`, message, userId ? `User: ${userId}` : '')
  }
}

export const logger = new Logger()

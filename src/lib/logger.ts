export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  warn: (msg: string, meta?: any) => {
    console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message: msg, ...meta }));
  },
  error: (msg: string, error?: any, meta?: any) => {
    const errorDetails = error instanceof Error ? { error_message: error.message, stack: error.stack } : { error };
    console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message: msg, ...errorDetails, ...meta }));
  }
};

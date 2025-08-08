export interface LogPayload {
  event: string;
  route?: string;
  payload?: Record<string, any> | undefined;
  error?: any;
  timestamp: string;
}

const serializeError = (err: any) => {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack?.slice(0, 2000),
    };
  }
  try {
    return JSON.parse(JSON.stringify(err));
  } catch {
    return { message: String(err) };
  }
};

export const logError = (event: string, payload?: Record<string, any>, error?: any) => {
  const entry: LogPayload = {
    event,
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    payload,
    error: serializeError(error),
    timestamp: new Date().toISOString(),
  };

  // Console structured log
  // Use a consistent prefix to filter easily
  // eslint-disable-next-line no-console
  console.error('[AppError]', entry);

  try {
    localStorage.setItem('lastError', JSON.stringify(entry));
  } catch {
    // ignore quota errors
  }
};

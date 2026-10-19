import "server-only";

export async function retryDbRead<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!(error instanceof Error) || !/Connection terminated unexpectedly|ECONNRESET|P1017/.test(error.message)) {
      throw error;
    }
    return read();
  }
}

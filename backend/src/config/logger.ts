import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

export const logger = pino({
  // Silence all output during tests to keep jest output clean
  level: isTest ? 'silent' : isDev ? 'debug' : 'info',

  // In development, use pino-pretty for human-readable coloured output.
  // In production, output raw JSON (machine-readable for log aggregators).
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
});

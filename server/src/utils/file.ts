import { HttpException, StreamableFile } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { createReadStream } from 'node:fs';
import { access, constants, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { Transform, TransformCallback } from 'node:stream';
import { setTimeout as sleep } from 'node:timers/promises';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { CacheControl } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ImmichReadStream } from 'src/repositories/storage.repository';
import { isConnectionAborted } from 'src/utils/misc';

class ThrottleTransform extends Transform {
  private bytesPerSecond: number;
  private startTime: number;
  private bytesSent: number;

  constructor(bytesPerSecond: number) {
    super();
    this.bytesPerSecond = bytesPerSecond;
    this.startTime = Date.now();
    this.bytesSent = 0;
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback): void {
    this.bytesSent += chunk.length;
    const targetTime = (this.bytesSent / this.bytesPerSecond) * 1000;
    const elapsed = Date.now() - this.startTime;
    const delay = Math.max(0, targetTime - elapsed);

    setTimeout(() => {
      callback(null, chunk);
    }, delay);
  }
}

export function getFileNameWithoutExtension(path: string): string {
  return basename(path, extname(path));
}

export function getFilenameExtension(path: string): string {
  return extname(path);
}

export function getLivePhotoMotionFilename(stillName: string, motionName: string) {
  return getFileNameWithoutExtension(stillName) + extname(motionName);
}

export async function hasAlphaChannel(input: string | Buffer): Promise<boolean> {
  const metadata = await sharp(input).metadata();
  return metadata.hasAlpha === true;
}

export class ImmichFileResponse {
  public readonly path!: string;
  public readonly contentType!: string;
  public readonly cacheControl!: CacheControl;
  public readonly fileName?: string;

  constructor(response: ImmichFileResponse) {
    Object.assign(this, response);
  }
}
type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

const cacheControlHeaders: Record<CacheControl, string | null> = {
  [CacheControl.PrivateWithCache]:
    'private, max-age=86400, no-transform, stale-while-revalidate=2592000, stale-if-error=2592000',
  [CacheControl.PrivateWithoutCache]: 'private, no-cache, no-transform',
  [CacheControl.None]: null, // falsy value to prevent adding Cache-Control header
};

export const sendFile = async (
  res: Response,
  next: NextFunction,
  handler: () => Promise<ImmichFileResponse> | ImmichFileResponse,
  logger: LoggingRepository,
): Promise<void> => {
  // promisified version of 'res.sendFile' for cleaner async handling
  const _sendFile = (path: string, options: SendFileOptions) =>
    promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

  try {
    const file = await handler();
    const cacheControlHeader = cacheControlHeaders[file.cacheControl];
    if (cacheControlHeader) {
      // set the header to Cache-Control
      res.set('Cache-Control', cacheControlHeader);
    }

    res.header('Content-Type', file.contentType);
    if (file.fileName) {
      res.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    }

    await access(file.path, constants.R_OK);

    return await _sendFile(file.path, { dotfiles: 'allow' });
  } catch (error: Error | any) {
    // ignore client-closed connection
    if (isConnectionAborted(error) || res.headersSent) {
      return;
    }

    // log non-http errors
    if (error instanceof HttpException === false) {
      logger.error(`Unable to send file: ${error}`, error.stack);
    }

    res.header('Cache-Control', 'none');
    next(error);
  }
};

export const asStreamableFile = ({ stream, type, length }: ImmichReadStream) => {
  return new StreamableFile(stream, { type, length });
};

const THROTTLE_TRANSFER_DURATION_SECONDS = 6;
const THROTTLE_INITIAL_DELAY_MS = 500;

export const sendFileThrottled = async (
  res: Response,
  next: NextFunction,
  handler: () => Promise<ImmichFileResponse> | ImmichFileResponse,
  logger: LoggingRepository,
  durationSeconds: number = THROTTLE_TRANSFER_DURATION_SECONDS,
): Promise<void> => {
  try {
    const file = await handler();
    const cacheControlHeader = cacheControlHeaders[file.cacheControl];
    if (cacheControlHeader) {
      res.set('Cache-Control', cacheControlHeader);
    }

    res.header('Content-Type', file.contentType);
    if (file.fileName) {
      res.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    }

    const fileStat = await stat(file.path);
    res.header('Content-Length', fileStat.size.toString());

    await sleep(THROTTLE_INITIAL_DELAY_MS);

    const bytesPerSecond = fileStat.size / durationSeconds;
    const readStream = createReadStream(file.path);
    const throttle = new ThrottleTransform(bytesPerSecond);

    readStream.pipe(throttle).pipe(res);

    readStream.on('error', (error) => {
      if (!isConnectionAborted(error) && !res.headersSent) {
        logger.error(`Unable to send file: ${error}`, (error as Error).stack);
        res.header('Cache-Control', 'none');
        next(error);
      }
    });
  } catch (error: Error | any) {
    if (isConnectionAborted(error) || res.headersSent) {
      return;
    }

    if (error instanceof HttpException === false) {
      logger.error(`Unable to send file: ${error}`, error.stack);
    }

    res.header('Cache-Control', 'none');
    next(error);
  }
};

import { LoggerService } from '@nestjs/common';

export class MockLogger implements LoggerService {
  public log = vi.fn();
  public error = vi.fn();
  public warn = vi.fn();
  public debug = vi.fn();
  public verbose = vi.fn();
}

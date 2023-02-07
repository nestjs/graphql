import { LoggerService } from '@nestjs/common';

export class MockLogger implements LoggerService {
  public log = jest.fn();
  public error = jest.fn();
  public warn = jest.fn();
  public debug = jest.fn();
  public verbose = jest.fn();
}

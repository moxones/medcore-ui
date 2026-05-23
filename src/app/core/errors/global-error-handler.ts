import { ErrorHandler, Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  handleError(error: unknown): void {
    if (this.isBrowser) {
      console.error(error);
    }
  }
}

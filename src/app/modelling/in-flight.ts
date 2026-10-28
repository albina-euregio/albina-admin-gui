import type { Observable, Subscription } from "rxjs";

export class InFlight {
  private url?: string;
  private subscription?: Subscription;

  constructor(private readonly fetch: (url: string) => Observable<unknown>) {}

  /** Whether the url is the one in flight. */
  loads(url: string): boolean {
    return this.url === url;
  }

  /** Loads the url in place of the one in flight unless it is that one; a failed url is forgotten, to be asked again. */
  load<T>(url: string, parse: (body: unknown) => T, next: (value: T) => void, failed: (err: unknown) => void) {
    if (this.loads(url)) return;
    this.cancel();
    this.url = url;
    this.subscription = this.fetch(url).subscribe({
      next: (body) => {
        this.url = undefined;
        next(parse(body));
      },
      error: (err) => {
        this.url = undefined;
        failed(err);
      },
    });
  }

  /** Stops the request in flight, if any. */
  cancel() {
    this.subscription?.unsubscribe();
    this.subscription = undefined;
    this.url = undefined;
  }
}

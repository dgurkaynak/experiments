export default class WorkerReqResWrapper {
  isBusy = false;
  resolver: (value?: {}) => void;


  constructor(public worker: Worker) {
    this.worker.onmessage = event => this.onMessage(event);
  }


  onMessage(event: MessageEvent) {
    if (this.resolver) {
      this.isBusy = false;
      const resolver = this.resolver;
      this.resolver = null;
      resolver(event.data);
    }
  }


  async postMessage(message: any, transfer?: Transferable[]) {
    if (this.isBusy) throw new Error('Worker is busy');
    this.isBusy = true;
    this.worker.postMessage(message, transfer);
    return new Promise((resolve, reject) => {
      this.resolver = resolve;
    });
  }
}

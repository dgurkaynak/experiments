import times from 'lodash/times';
import WorkerReqResWrapper from './worker-req-res-wrapper';


class Message {
  message: any;
  transfer?: Transferable[];
  resolver: (data?: any) => void;
}


export default class WorkerReqResPool {
  messageQueue: Message[] = [];
  busyWorkers: WorkerReqResWrapper[] = [];
  avaliableWorkers: WorkerReqResWrapper[] = [];


  constructor(createWorker: () => Worker, count: number) {
    times(count, () => {
      const worker = createWorker();
      const workerWrapper = new WorkerReqResWrapper(worker);
      this.avaliableWorkers.push(workerWrapper);
    });
  }


  async addToMessageQueue(message: any, transfer?: Transferable[]) {
    return new Promise((resolve, reject) => {
      const message_ = new Message();
      message_.message = message;
      message_.transfer = transfer;
      message_.resolver = resolve;

      this.messageQueue.push(message_);
      this.consumeQueue();
    });
  }


  consumeQueue() {
    if (this.avaliableWorkers.length == 0) return;
    if (this.messageQueue.length == 0) return;

    const [worker] = this.avaliableWorkers.splice(0, 1);
    const [message] = this.messageQueue.splice(0, 1);
    this.busyWorkers.push(worker);

    worker
      .postMessage(message.message, message.transfer)
      .then((result) => {
        const workerBusyIndex = this.busyWorkers.indexOf(worker);
        this.busyWorkers.splice(workerBusyIndex, 1);
        this.avaliableWorkers.push(worker);
        message.resolver(result);
        this.consumeQueue();
      });
  }
}

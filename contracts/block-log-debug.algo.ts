import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class BlockLogDebug extends Contract {
  createApplication(): void {
    log(this.txn.txID);
  }
}

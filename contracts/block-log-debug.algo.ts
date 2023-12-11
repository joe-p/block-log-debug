import { Contract } from '@algorandfoundation/tealscript';

// eslint-disable-next-line no-unused-vars
class BlockLogDebug extends Contract {
  createApplication(): void {
    log(hex('0xdeadbeef'));
  }

  emitLogs(): void {
    sendMethodCall<[], void>({
      name: 'createApplication',
      approvalProgram: this.app.approvalProgram,
      clearStateProgram: this.app.clearStateProgram,
    });

    log(hex('0xD00D2BAD'));
  }
}

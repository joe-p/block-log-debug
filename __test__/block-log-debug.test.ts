import {
  describe, test, expect, beforeAll, beforeEach,
} from '@jest/globals';
import algosdk from 'algosdk';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { unpack, pack } from 'msgpackr';
import { BlockLogDebugClient } from '../contracts/clients/BlockLogDebugClient';

const fixture = algorandFixture();

describe('BlockLogDebug', () => {
  beforeEach(fixture.beforeEach);
  let sender: algosdk.Account;

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount } = fixture.context;

    sender = testAccount;
  });

  test('msgpack', async () => {
    const { algod } = fixture.context;

    const appClient = new BlockLogDebugClient(
      {
        sender,
        resolveBy: 'id',
        id: 0,
      },
      algod,
    );

    const result = await appClient.create.createApplication({});

    const lastRound = (await fixture.context.algod.status().do())['last-round'];

    const fetchResult = await fetch(`http://localhost:4001/v2/blocks/${lastRound}?format=msgpack`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'X-Algo-API-Token': 'a'.repeat(64),
      },
    });

    const blob = await fetchResult.blob();

    const block = unpack(Buffer.from(await blob.arrayBuffer()));

    const logFromBlock = block.block.txns[0].dt.lg[0];
    const logFromTxn = result.confirmation!.logs![0];

    const logBytes = new Uint8Array(Buffer.from(logFromBlock));

    // For some reason the length of the log from the block is not always 32!
    expect(logFromBlock.length).toBe(32);
    expect(logBytes).toEqual(logFromTxn);
    expect(logBytes).toEqual(algosdk.decodeAddress(sender.addr).publicKey);
    expect(algosdk.encodeAddress(Buffer.from(logFromBlock))).toBe(sender.addr);
  });

  test('json', async () => {
    const { algod } = fixture.context;

    const appClient = new BlockLogDebugClient(
      {
        sender,
        resolveBy: 'id',
        id: 0,
      },
      algod,
    );

    const result = await appClient.create.createApplication({});

    const lastRound = (await fixture.context.algod.status().do())['last-round'];

    const fetchResult = await fetch(`http://localhost:4001/v2/blocks/${lastRound}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'X-Algo-API-Token': 'a'.repeat(64),
      },
    });

    const block = await fetchResult.json();

    const logFromBlock = block.block.txns[0].dt.lg[0];
    const logFromTxn = result.confirmation!.logs![0];

    const logBytes = new Uint8Array(Buffer.from(logFromBlock));

    // For some reason the length of the log from the block is not always 32!
    expect(logFromBlock.length).toBe(32);
    expect(logBytes).toEqual(logFromTxn);
    expect(logBytes).toEqual(algosdk.decodeAddress(sender.addr).publicKey);
    expect(algosdk.encodeAddress(Buffer.from(logFromBlock))).toBe(sender.addr);
  });
});

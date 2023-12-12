import {
  describe, test, expect, beforeAll, beforeEach,
} from '@jest/globals';
import algosdk from 'algosdk';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { unpack } from 'msgpackr';
import { microAlgos } from '@algorandfoundation/algokit-utils';
import { BlockLogDebugClient } from '../contracts/clients/BlockLogDebugClient';

const fixture = algorandFixture();

describe('algod /blocks/{round}/logs', () => {
  beforeEach(fixture.beforeEach);
  let sender: algosdk.Account;

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount } = fixture.context;

    sender = testAccount;
  });

  test('logs endpoint', async () => {
    const { algod } = fixture.context;

    const appClient = new BlockLogDebugClient(
      {
        sender,
        resolveBy: 'id',
        id: 0,
      },
      algod,
    );

    await appClient.create.createApplication({});
    await appClient.appClient.fundAppAccount({ amount: microAlgos(200_000) });
    await appClient.emitLogs({}, { sendParams: { fee: microAlgos(2_000) } });

    const lastRound = (await fixture.context.algod.status().do())['last-round'];

    const fetchResult = await fetch(`http://localhost:4001/v2/blocks/${lastRound}/logs`, {
      method: 'GET',
      headers: {
        'X-Algo-API-Token': 'a'.repeat(64),
      },
    });

    const logsFromResponse = (await fetchResult.json()).logs;

    const logFromResponse = logsFromResponse[0]?.logs[0];
    expect(logFromResponse).toBeDefined();

    const hexLog = Buffer.from(logFromResponse, 'base64').toString('hex');
    expect(hexLog).toEqual('d00d2bad');

    const innerLogFromResponse = logsFromResponse[1]?.logs[0];
    expect(innerLogFromResponse).toBeDefined();

    const innerHexLog = Buffer.from(innerLogFromResponse, 'base64').toString('hex');
    expect(innerHexLog).toEqual('deadbeef');
  });
});

describe('algod /blocks/{round}', () => {
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

    await appClient.create.createApplication({});
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

    const logFromResponse = block.block.txns[0].dt.lg[0];
    const hexLog = Buffer.from(logFromResponse).toString('hex');

    expect(hexLog).toEqual('deadbeef');
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

    await appClient.create.createApplication({});
    const lastRound = (await fixture.context.algod.status().do())['last-round'];

    const fetchResult = await fetch(`http://localhost:4001/v2/blocks/${lastRound}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'X-Algo-API-Token': 'a'.repeat(64),
      },
    });

    const logFromResponse = (await fetchResult.json()).block.txns[0].dt.lg[0];
    const hexLog = Buffer.from(logFromResponse).toString('hex');

    expect(hexLog).toEqual('deadbeef');
  });
});

describe('indexer', () => {
  beforeEach(fixture.beforeEach);
  let sender: algosdk.Account;

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount } = fixture.context;

    sender = testAccount;
  });

  test('/blocks/{round}', async () => {
    const { algod } = fixture.context;

    const appClient = new BlockLogDebugClient(
      {
        sender,
        resolveBy: 'id',
        id: 0,
      },
      algod,
    );

    await appClient.create.createApplication({});
    const lastRound = (await fixture.context.algod.status().do())['last-round'];

    // eslint-disable-next-line no-promise-executor-return
    await new Promise((r) => setTimeout(r, 1000));

    const fetchResult = await fetch(`http://localhost:8980/v2/blocks/${lastRound}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        'X-Algo-API-Token': 'a'.repeat(64),
      },
    });

    const json = await fetchResult.json();

    const logFromResponse = json.transactions[0].logs[0];
    const hexLog = Buffer.from(logFromResponse, 'base64').toString('hex');

    expect(hexLog).toEqual('deadbeef');
  });
});

import {
  describe, test, expect, beforeAll, beforeEach,
} from '@jest/globals';
import algosdk from 'algosdk';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import { unpack } from 'msgpackr';
import { BlockLogDebugClient } from '../contracts/clients/BlockLogDebugClient';

const fixture = algorandFixture();

describe('/blocks/{round}/logs', () => {
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
    const lastRound = (await fixture.context.algod.status().do())['last-round'];

    const fetchResult = await fetch(`http://localhost:4001/v2/blocks/${lastRound}/logs`, {
      method: 'GET',
      headers: {
        'X-Algo-API-Token': 'a'.repeat(64),
      },
    });

    const logFromResponse = (await fetchResult.json()).logs[0].logs[0];
    const hexLog = Buffer.from(logFromResponse, 'base64').toString('hex');

    expect(hexLog).toEqual('deadbeef');
  });
});

describe('/blocks/{round}', () => {
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

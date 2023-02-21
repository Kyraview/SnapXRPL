globalThis.Buffer = require('buffer/').Buffer;
import { OnRpcRequestHandler } from '@metamask/snap-types';
import {initAccountManager} from './Accounts';
import { XrpClient } from './XrpClient';
import { Transaction } from 'xrpl';
import { TransactionBuilder } from './TransactionBuilder';
import { Metamask } from './utils/metamask';
import AutoFill from './utils/AutoFill';
import { WalletFuncts } from './WalletFuncts';


export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  
  
  const accountManager = await initAccountManager();
  const userAccount = await accountManager.getCurrentWallet();

  let network : "testnet" | "mainnet" = "mainnet";
  if(request.params && request.params['network']){
    if(request.params['network'] === "testnet" || request.params['network'] === "mainnet")
      network = request.params['network']
  }
  const client = new XrpClient(origin, network);
  const walletFuncts = new WalletFuncts(client, userAccount, network)
  switch (request.method) {
    case 'getAddress':
      return userAccount.address
    case 'getAccountInfo':
      return await client.getAccountInfo(userAccount.address)
    case 'getBalance':
      return await client.getBalance(userAccount.address);
    case 'signTxn':
      return await walletFuncts.signTxn(request.params.txn)
    case 'transfer':
      return await walletFuncts.transfer(request.params.amount, request.params.to)
    default:
      throw new Error('Method not found.');
      
  }
};

globalThis.Buffer = require('buffer/').Buffer;
import { OnRpcRequestHandler } from '@metamask/snap-types';
import { getAccount } from './Accounts';
import { XrpClient } from './XrpClient';
import { Client, Transaction } from 'xrpl';
import { TransactionBuilder } from './TransactionBuilder';
import { Metamask } from './utils/metamask';
import AutoFill from './utils/AutoFill';

export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  
  const userAccount = await  getAccount(2);
  let network : "testnet" | "mainnet" = "mainnet";
  if(request.params && request.params['network']){
    if(request.params['network'] === "testnet" || request.params['network'] === "mainnet")
      network = request.params['network']
  }
  const client = new XrpClient(network);
  switch (request.method) {
    case 'getAddress':
      return userAccount.address
    case 'getAccountInfo':
      return await client.getAccountInfo(userAccount.address)
    case 'getBalance':
      return await client.getBalance(userAccount.address);
    case 'signTxn':
      const confirm = await Metamask.sendConfirmation("Sign Transaction", network, "Would you like to sign a transaction from "+origin)
      if(!confirm){
        return "User Rejected request";
      }
      const filledTxn = await AutoFill(client, request.params.txn);
      console.log("txn is");
      console.log(request.params.txn);
      console.log("filled txn is");
      console.log(filledTxn);
      const signature = userAccount.sign(filledTxn as Transaction);
      return signature;
    case 'transfer':
      console.log("called");
      const confirmed = await Metamask.sendConfirmation("send Transaction", 
      network, 
      `Send ${request.params.amount} to ${request.params.to}`)
      if(!confirmed){
        Metamask.throwError(4300, "user rejected request");
      }
      const txn = await TransactionBuilder.buildPaymentXrp(client, userAccount.address, request.params.to, request.params.amount);

      const signed = userAccount.sign(txn);
      let submited = await client.submit(signed.tx_blob);
      console.log(submited);
      return signed.hash;
      
    default:
      throw new Error('Method not found.');
      
  }
};

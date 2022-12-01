import { OnRpcRequestHandler } from '@metamask/snap-types';
import { getAccount } from './Accounts';
import { XrpClient } from './XrpClient';
import { Client } from 'xrpl';
import { TransactionBuilder } from './TransactionBuilder';

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
      return 'yes'
    case 'transfer':
      console.log("called");
      const txn = await TransactionBuilder.buildPaymentXrp(client, userAccount.address, request.params.to, request.params.amount);
      const signed = userAccount.sign(txn);
      await client.submit(signed.tx_blob);
      return signed.hash;
      
    default:
      throw new Error('Method not found.');
      
  }
};

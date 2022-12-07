


import {getBIP44AddressKeyDeriver, JsonBIP44CoinTypeNode} from '@metamask/key-tree';
import { Wallet } from 'xrpl';
  
export async function getAccount(path: number): Promise<Wallet> {
  // By way of example, we will use Dogecoin, which has `coin_type` 3.
  const aptosCoinNode = (await wallet.request({
    method: 'snap_getBip44Entropy',
    params: {
      coinType: 144,
    },
  })) as JsonBIP44CoinTypeNode;

  // Next, we'll create an address key deriver function for the Dogecoin coin_type node.
  // In this case, its path will be: m / 44' / 3' / 0' / 0 / address_index
  const deriveDogecoinAddress = await getBIP44AddressKeyDeriver(aptosCoinNode);
  const derivedAccount = await deriveDogecoinAddress(path);
  const Account = Wallet.fromEntropy(derivedAccount.privateKeyBytes);
  return Account;
}
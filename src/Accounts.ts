


import {getBIP44AddressKeyDeriver, JsonBIP44CoinTypeNode} from '@metamask/key-tree';
import { Wallet } from 'xrpl';

interface Account_Interface{
  name: string,
  path: number,
  address: string,
  swaps: Array<swap>
}

interface swap{
  from: string,
  to: string,
  time: Date,
  id: string,
  url: string,
}

interface stateInterface{
  Accounts: {[address:string]: Account_Interface} | null,
  currentAccount: string | null//address
}

type state = stateInterface | null 

export async function generateWallet(path: number): Promise<Wallet> {
  // By way of example, we will use Dogecoin, which has `coin_type` 3.
  const aptosCoinNode = (await snap.request({
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


async function getState(): Promise<state>{
  const state = await snap.request({
    method: 'snap_manageState',
    params: {operation:'get'},
  }) as state;
  return state
}


export async function initAccountManager() : Promise<AccountManager>{
  let state : state = await getState()
  console.log("state is")
  console.log(state)
  if(state === null || state === undefined){
    console.log("state has not been set setting state now")
    const Account1: Wallet = await generateWallet(2);
    
    state = {
      Accounts: {},
      currentAccount: null
    }
    state.Accounts[Account1.address] = {
      name: "Account1",
      address: Account1.address,
      path: 2,
      swaps: []
    }
    state.currentAccount = Account1.address
    console.log("state Is")
    console.log(state)
    await snap.request({
      method: 'snap_manageState',
      params: {
        operation:'update', 
        newState:state
      },
    });
  }
  return new AccountManager(state)
}

class AccountManager{
  state: state
  currentAccountAddress: string

  constructor(state: state){
    this.state = state
    this.currentAccountAddress = state.currentAccount
  }

  async getCurrentWallet(): Promise<Wallet>{
    const CurrentAccount = this.state.Accounts[this.currentAccountAddress]
    const path = CurrentAccount.path
    const currentwallet = await generateWallet(path);
    return currentwallet;
  }

  async setCurrentAccount(address: string){
    
    const account = this.state.Accounts[address]
    if(account === undefined){
      //throw Error
    }
    this.state.currentAccount = address;
    await this._setState(this.state);
  }

  async _setState(state: state): Promise<void>{
    await snap.request({
      method: 'snap_manageState',
      params: {operation:'update', newState:state},
    });
  }

  async createNewAccount(name: string){
    try{
      const path = 2+(Object.keys(this.state.Accounts).length)
      const Wallet = await generateWallet(path);
      const Account: Account_Interface = {
        name: name,
        path: path,
        address: Wallet.address,
        swaps: []
      }
      this.state.Accounts[Wallet.address] = Account;
      await this._setState(this.state);
      return true;
    }
    catch(e){
      return false;
    }
  }
}
# XRPL on Metamask

### Demo: [https://xrpldemo2.paulfears.repl.co/](https://xrpldemo2.paulfears.repl.co/)
### npm: [https://www.npmjs.com/package/snapxrpl](https://www.npmjs.com/package/snapxrpl)

<hr>

This repository uses Metamask Snaps to run an xrpl wallet inside of metamask
This currently only works on metamask flask with plans to be available for the consumer extension in april
<hr>

## Installation
This can be installed into any metamask flask extension from client side javascript simply by
sending this rpc request to the etherium object in metamask

```javascript 
async function connect () {
  await window.ethereum.request({
    method: 'wallet_enable',
    params: [{
      wallet_snap: { ["npm:snapxrpl"]: {} },
      }]
    })
  }

```
This will Install the code from directly from npm and install it directly into the users metamask extension. From here Requests can be sent to interact with the xrp ledger through the metamask api


## build from Source
```console
~$ yarn
~$ npx patch-package
~$ npx mm-snap build
~$ npx mm-snap serve

Starting server...
Server listening on: http://localhost:8080

```
<hr>

## Dapp Quick Start
```typescript

//Connect Metamask to the Website and auto install extension

let XRPConnected = false

async function connect () {
  try{
    await window.ethereum.request({
      method: 'wallet_enable',
      params: [{
        wallet_snap: { ["npm:snapxrpl"]: {} },
        }]
    })
    XRPConnected = true
    return true
  }
  catch(e){
    console.log("user rejected Connection request")
    throw e
  }
}

//Signing A Transaction
async function signRaw( transaction ): signedTxn{
  if(!xrpConnected){
    alert("Connect must be called first")
  }
  const response = await window.ethereum.request({
    method: 'wallet_invokeSnap',
    params: ["npm:snapxrpl", {
      method: 'signTxn',
      params:{
        txn: transaction,
        network: "testnet" // or "mainnet"
      }
    }]
  })
  return response
}



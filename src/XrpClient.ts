const DEFAULT_FEE_CUSHION = 1.2
const DEFAULT_MAX_FEE_XRP = '2'
import { Transaction } from "xrpl";
import AutoFill from "./utils/AutoFill";

export class XrpClient{
    networks;
    network: 'mainnet' | 'testnet';
    nodeURL: string;
    maxFeeXRP: string;
    feeCushion: number;
    constructor(network?: 'mainnet' | 'testnet', config?: any){
        this.network = network ?? 'mainnet';
        const networks = {
            'testnet': "https://TestnetProxy.paulfears.repl.co/testnet",
            'mainnet': "https://xrplcluster.com/"
        }
        this.nodeURL = networks[this.network];
        this.feeCushion = config?.feeCushion ?? DEFAULT_FEE_CUSHION
        this.maxFeeXRP = config?.maxFeeXRP ?? DEFAULT_MAX_FEE_XRP
    }


    async request(data) {
        console.log("making request");
        const response = await fetch(this.nodeURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        return response.json();
    }

    async autoFill(txn:Transaction): Promise<Transaction>{
        return await AutoFill(this, txn)
    }

    async getAccountInfo(addr: string){
        console.log(addr);
        const accountInfo = await this.request({
            "method": "account_info",
            "params": [
                {
                    "account": addr,
                    "strict": true,
                    "ledger_index": "validated",
                    "api_version": 1
                }
            ]
        })
        console.log(accountInfo);

        return accountInfo;


    }

    async getBalance(addr: string) : Promise<string>{
        const account_data = await this.getAccountInfo(addr)
        try{
            return account_data.result.account_data.Balance;
        }
        catch(e){
            return "0";
        }
    }

    async submit(blob){
        const response = await this.request({
            "method": "submit",
            "params": [
                {
                    "tx_blob": blob
                }
            ]
        })
        return response
    }
}
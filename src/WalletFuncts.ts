

import { dropsToXrp, Wallet, xrpToDrops } from "xrpl";
import { TransactionBuilder } from "./TransactionBuilder";
import { Metamask } from "./utils/metamask";
import AutoFill from "./utils/AutoFill";
import { XrpClient } from "./XrpClient";
import { Transaction } from 'xrpl';
import { panel, Panel, text, heading, divider, copyable } from '@metamask/snaps-ui';
export class WalletFuncts{
    client: XrpClient
    wallet: Wallet
    network: string
    constructor(client: XrpClient, wallet: Wallet, network: string){
        this.client = client
        this.wallet = wallet
        this.network = network
    }

    async signTxn(txn){
        console.log(txn);
        const txType = txn.TransactionType
        const filledTxn = await AutoFill(this.client, txn);
        let info = panel([]);
        if(txType === "Payment"){
            if(typeof filledTxn["Amount"] === "string"){
                info = panel([
                    text("Destination"),
                    copyable(filledTxn["Destination"]),
                    text("Amount"),
                    text(`${dropsToXrp(filledTxn["Amount"])} XRP`)
                ])
            }
            if(typeof filledTxn["Amount"] === "object"){
                info = panel([
                text("Destination"),
                copyable(filledTxn["Destination"]),
                text("Amount"),
                text(`${filledTxn["Amount"]["value"]} ${filledTxn["Amount"]["currency"]}`)
                ])
            }
        }
        if(txType === "TrustSet"){
            info = panel([
                text("Currency"),
                copyable(filledTxn["LimitAmount"]["currency"]),
                text("Amount"),
                text(filledTxn["LimitAmount"]["value"]),
                text("Issuer"),
                copyable(filledTxn["LimitAmount"]["issuer"])
            ])
        }
        const confirm = await Metamask.displayPanel(
            panel([
            heading(`Sign ${txType} Transaction`),
            divider(),
            text("Origin: "+this.client.origin),
            text(`TX Fee: ${filledTxn.Fee} drops`),
            info
            ]),
            "Confirmation"
            )
        if(!confirm){
          return "User Rejected request";
        }
        
        console.log("txn is");
        console.log(txn);
        console.log("filled txn is");
        console.log(filledTxn);
        const signature = this.wallet.sign(filledTxn as Transaction);
        return signature;
    }
    signAndSubmitTxn(){}
    submitTxn(){}

    async transfer(amount:string, to:string){
        console.log("called Transfer");
        const txn = await TransactionBuilder.buildPaymentXrp(
            this.client, 
            this.wallet.address, 
            to, amount
        );
        console.log("finished building txn")
        
        
        const confirmed = await Metamask.displayPanel(panel([
            heading("Transfer"),
            text(this.client.network),
            divider(),
            text("Recepient"),
            copyable(txn["Destination"]),
            text("Amount"),
            text(`${dropsToXrp(amount)} XRP`),
            text("Fee"),
            text(`${txn.Fee} Drops`)
        ]), "Confirmation")

        if(!confirmed){
          Metamask.throwError(4300, "user rejected request");
        }

  
        const signed = this.wallet.sign(txn);
        let submited = await this.client.submit(signed.tx_blob);
        console.log(submited);
        
        return signed.hash;
    }
}
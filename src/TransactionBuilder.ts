
import { Transaction } from "xrpl";
import { XrpClient } from "./XrpClient";

export class TransactionBuilder{
    
    static async buildPaymentXrp(client: XrpClient, from: string, to: string, drops: string | BigInt | number){
        console.log("here")
        const txnOutline = {
            "TransactionType": "Payment",
            "Account": from,
            "Amount": String(drops),
            "Destination": to
        }
        console.log(from);
        console.log(to);
        console.log(drops);
        return await client.autoFill(txnOutline as Transaction);
    }
}
import BigNumber from "bignumber.js";
import { XrpClient } from "../XrpClient";
import { Transaction } from "xrpl";
import { xrpToDrops } from "xrpl";
const NUM_DECIMAL_PLACES = 6
const BASE_10 = 10
const LEDGER_OFFSET = 20


export default async function AutoFill(client: XrpClient, txn: Transaction): Promise<Transaction>{
    console.log("calculating fee");
    const fee = await calculateFeePerTransactionType(client, txn);
    console.log("fee is: "+fee);
    console.log("getting sequence num")
    const Sequence = await getNextValidSequenceNumber(client, txn);
    console.log("sequence Num is: "+Sequence);
    console.log("displaying ledger Index");
    const ledgerIndex = await getLatestValidatedLedgerSequence(client, txn);
    console.log("ledger Index is: "+ledgerIndex);
    txn.Fee = fee;
    txn.Sequence = Sequence;
    txn.LastLedgerSequence = ledgerIndex;
    return txn;

}




/* 
*
*
*-----------------------helper functions-----------------------------------------
*
*
*
*/
async function fetchAccountDeleteFee(client: XrpClient): Promise<BigNumber> {
    const response = await client.request({ method: 'server_state' })
    const fee = response.result.state.validated_ledger?.reserve_inc

    if (fee == null) {
        return Promise.reject(new Error('Could not fetch Owner Reserve.'))
    }

    return new BigNumber(fee)
}


async function getFeeXrp(
client: XrpClient,
cushion?: number,
): Promise<string> {
    const feeCushion = cushion ?? client.feeCushion
    console.log("getting server fee info")

    const serverInfo = (await client.request({ method: 'server_info' })).result
        .info
    console.log(serverInfo);
    const baseFee = serverInfo.validated_ledger?.base_fee_xrp

    if (baseFee == null) {
        throw new Error(
        'getFeeXrp: Could not get base_fee_xrp from server_info',
        )
    }

    const baseFeeXrp = new BigNumber(baseFee)
    if (serverInfo.load_factor == null) {
        // https://github.com/ripple/rippled/issues/3812#issuecomment-816871100
        serverInfo.load_factor = 1
    }
    let fee = baseFeeXrp.times(serverInfo.load_factor).times(feeCushion)

    // Cap fee to `client.maxFeeXRP`
    fee = BigNumber.min(fee, client.maxFeeXRP)
    // Round fee to 6 decimal places
    return new BigNumber(fee.toFixed(NUM_DECIMAL_PLACES)).toString(BASE_10)
}

function scaleValue(value, multiplier): string {
    return new BigNumber(value).times(multiplier).toString()
  }
async function getLedgerIndex(client: XrpClient): Promise<number> {
    const ledgerResponse = await client.request({
      method: "ledger",
      "params":[{
        "ledger_index": "validated",
      }]
    })
    return ledgerResponse.result.ledger_index
}
async function getLatestValidatedLedgerSequence(
    client: XrpClient,
    tx: Transaction,
  ): Promise<number> {
    const ledgerSequence = await getLedgerIndex(client);
    // eslint-disable-next-line no-param-reassign -- param reassign is safe
    return ledgerSequence + LEDGER_OFFSET
  }
async function getNextValidSequenceNumber(
    client: XrpClient,
    tx: Transaction,
): Promise<number> {
    const request = {
      "method": "account_info",
      "params":[{
        "account": tx.Account,
        "ledger_index": "current",
        "strict": true,
        "api_version": 1
      }]
    }
    const data = await client.request(request)
    // eslint-disable-next-line no-param-reassign, require-atomic-updates -- param reassign is safe with no race condition
    return data.result.account_data.Sequence
}

async function calculateFeePerTransactionType(
    client: XrpClient,
    tx: Transaction,
    signersCount = 0,
  ): Promise<string> {
    // netFee is usually 0.00001 XRP (10 drops)
    const netFeeXRP = await getFeeXrp(client)
    const netFeeDrops = xrpToDrops(netFeeXRP)
    let baseFee = new BigNumber(netFeeDrops)
  
    // EscrowFinish Transaction with Fulfillment
    if (tx.TransactionType === 'EscrowFinish' && tx.Fulfillment != null) {
      const fulfillmentBytesSize: number = Math.ceil(tx.Fulfillment.length / 2)
      // 10 drops × (33 + (Fulfillment size in bytes / 16))
      const product = new BigNumber(
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- expected use of magic numbers
        scaleValue(netFeeDrops, 33 + fulfillmentBytesSize / 16),
      )
      baseFee = product.dp(0, BigNumber.ROUND_CEIL)
    }
  
    // AccountDelete Transaction
    if (tx.TransactionType === 'AccountDelete') {
      baseFee = await fetchAccountDeleteFee(client)
    }
  
    /*
     * Multi-signed Transaction
     * 10 drops × (1 + Number of Signatures Provided)
     */
    if (signersCount > 0) {
      baseFee = BigNumber.sum(baseFee, scaleValue(netFeeDrops, 1 + signersCount))
    }
  
    const maxFeeDrops = xrpToDrops(client.maxFeeXRP)
    const totalFee =
      tx.TransactionType === 'AccountDelete'
        ? baseFee
        : BigNumber.min(baseFee, maxFeeDrops)
  
    // Round up baseFee and return it as a string
    // eslint-disable-next-line no-param-reassign, @typescript-eslint/no-magic-numbers -- param reassign is safe, base 10 magic num
    return totalFee.dp(0, BigNumber.ROUND_CEIL).toString(10)
  }
  

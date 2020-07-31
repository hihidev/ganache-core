import getProvider from "../../helpers/getProvider";
import assert from "assert";
import EthereumProvider from "../../../src/provider";
import { Quantity } from "@ganache/utils";

describe("api", () => {
  describe("eth", () => {
    describe("eth_subscribe*", () => {
      let provider: EthereumProvider;
      let accounts: string[];
      const gasLimit = "0x6691b7";
      const now = new Date(2019, 3, 15);

      beforeEach(async () => {
        provider = await getProvider({
          time: now,
          gasLimit: Quantity.from(gasLimit),
          mnemonic: "sweet treat"
        });
        accounts = await provider.send("eth_accounts");
      });

      it("subscribes and unsubscribes", async () => {
        const timestamp = ((+now / 1000) | 0) + 1;
        const startingBlockNumber = parseInt(await provider.send("eth_blockNumber"));
        const subscriptionId = await provider.send("eth_subscribe", ["newHeads"]);

        assert(subscriptionId != null);
        assert.notStrictEqual(subscriptionId, false);
        
        // subscribe again
        const subscriptionId2 = await provider.send("eth_subscribe", ["newHeads"]);

        // trigger a mine, we should get two events
        await provider.send("evm_mine", [timestamp]);
        let counter = 0;
        
        const message = await new Promise((resolve) => {
          let firstMessage;
          provider.on("message", (message: any) => {
            counter++;
            if (counter === 1) {
              firstMessage = message;
            }
            if (counter === 2){
              assert.deepStrictEqual(firstMessage.data.result, message.data.result);
              resolve(firstMessage);
            }
          });
        });

        assert.deepStrictEqual(message, {
          type: "eth_subscription",
          data: {
            result: {
              "difficulty": "0x0",
              "extraData": "0x",
              "gasLimit": gasLimit,
              "gasUsed": "0x0",
              "hash": "0xdc949ca8143fa0e494f9a07ddaf88c6a28f5752c9d885d075929adeca110e7d3",
              "logsBloom": "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
              "miner": accounts[0],
              "mixHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
              "nonce": "0x0000000000000000",
              "number": Quantity.from(startingBlockNumber + 1).toString(),
              "parentHash": "0x03952e9b420b44ae0b35f9a0375ba91494db28d68d413f9255317ae289a8cd47",
              "receiptsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
              "sha3Uncles": "0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347",
              "stateRoot": "0x8281cb204e0242d2d9178e392b60eaf4563ae5ffc4897c9c6cf6e99a4d35aff3",
              "timestamp": Quantity.from(timestamp).toString(),
              "transactionsRoot": "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421"
            },
            subscription: subscriptionId
          }
        });

        // trigger a mine... we should only get a _single_ message this time
        const unsubResult = await provider.send("eth_unsubscribe", [subscriptionId]);
        assert.strictEqual(unsubResult, true);
        await provider.send("evm_mine", [timestamp]);
        await assert.doesNotReject(new Promise((resolve, reject) => {
          provider.on("message", async (message: any) => {
            if (subscriptionId2 === message.data.subscription) {
              const blockNumber = parseInt(await provider.send("eth_blockNumber"));
              assert.strictEqual(blockNumber, startingBlockNumber + 2);

              resolve();
            } else {
              reject(new Error("Unsubscribe didn't work!"));
            }
          });
        }));
      });

      it("returns false for unsubscribe with bad id", async () => {
        const unsubResult = await provider.send("eth_unsubscribe", ["0xffff"]);
        assert.strictEqual(unsubResult, false)
      });
    });
  });
});

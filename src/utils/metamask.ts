/*
Class for utility functions

wallet is a global in the metamask context
*/
export class Metamask {
    static throwError(code, msg) {
      if (code === undefined) {
        code = 0;
      }
      // metamask overrides Error codes
      // This function encodes an arc complient error code
      // into the error message, and is then seperated by the SDK
      throw new Error(`${code}\n${msg}`);
    }
  
    static async notify(message: string): Promise<boolean> {
      try {
        await wallet.request({
          method: 'snap_notify',
          params: [
            {
              type: 'inApp',
              message,
            },
          ],
        });
  
        const result = await wallet.request({
          method: 'snap_notify',
          params: [
            {
              type: 'native',
              message,
            },
          ],
        });
        console.log(result);
        return true;
      } catch (e) {
        console.log(e);
        await Metamask.sendConfirmation('alert', 'notifcation', message);
        return false;
      }
    }
  
    static async sendConfirmation(
      prompt: string,
      description: string,
      textAreaContent: string,
    ): Promise<boolean> {
      // turnicate strings that are too long
      if (typeof prompt === 'string') {
        prompt = prompt.substring(0, 40);
      }
  
      if (typeof description === 'string') {
        description = description.substring(0, 140);
      }
  
      if (typeof textAreaContent === 'string') {
        textAreaContent = textAreaContent.substring(0, 1800);
      }
  
      const confirm = (await wallet.request({
        method: 'snap_confirm',
        params: [
          {
            prompt,
            description,
            textAreaContent,
          },
        ],
      })) as boolean;
  
      return confirm;
    }
  }
  
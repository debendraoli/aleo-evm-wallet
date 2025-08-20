import { Command } from 'commander';
import crypto from 'crypto';
import { HDNodeWallet, Mnemonic, Wallet } from 'ethers';

function toHex(buf: Buffer) {
  return '0x' + buf.toString('hex');
}

export function evmCommands() {
  const cmd = new Command('evm').description('EVM wallet operations');

  cmd
    .command('create')
    .description('Create a new EVM wallet (mnemonic + address)')
    .option('-p, --password <password>', 'Optional password to encrypt the mnemonic with scrypt')
    .action(async (opts) => {
      const mnemonic = Mnemonic.fromEntropy(crypto.randomBytes(16));
      const wallet = HDNodeWallet.fromMnemonic(mnemonic);
      const out = {
        address: wallet.address,
        mnemonic: mnemonic.phrase,
        path: wallet.path,
        privateKey: wallet.privateKey,
      };
      if (opts.password) {
        const salt = crypto.randomBytes(16);
        const key = crypto.scryptSync(opts.password, salt, 32);
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const enc = Buffer.concat([cipher.update(mnemonic.phrase, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        console.log(JSON.stringify({
          type: 'encrypted-mnemonic',
          kdf: 'scrypt',
          salt: toHex(salt),
          iv: toHex(iv),
          tag: toHex(tag),
          data: toHex(enc),
          address: wallet.address,
          path: wallet.path,
        }, null, 2));
      } else {
        console.log(JSON.stringify(out, null, 2));
      }
    });

  cmd
    .command('import')
    .description('Import an EVM wallet from a mnemonic or private key')
    .option('-m, --mnemonic <mnemonic>', 'BIP39 mnemonic phrase')
    .option('-k, --private-key <privateKey>', 'Private key hex')
    .option('-d, --derivation-path <path>', 'Derivation path', "m/44'/60'/0'/0/0")
    .action(async (opts) => {
      let wallet: Wallet | HDNodeWallet;
      if (opts.mnemonic) {
        wallet = HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(opts.mnemonic), opts.derivationPath);
      } else if (opts.privateKey) {
        wallet = new Wallet(opts.privateKey);
      } else {
        throw new Error('Provide either --mnemonic or --private-key');
      }
      console.log(JSON.stringify({ address: wallet.address, privateKey: wallet.privateKey }, null, 2));
    });

  cmd
    .command('export')
    .description('Export EVM wallet as keystore (V3 JSON)')
    .requiredOption('-k, --private-key <privateKey>', 'Private key hex')
    .requiredOption('-p, --password <password>', 'Password to encrypt the keystore')
    .action(async (opts) => {
      const wallet = new Wallet(opts.privateKey);
      const json = await wallet.encrypt(opts.password);
      console.log(json);
    });

  return cmd;
}

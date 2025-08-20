import { Account } from '@provablehq/sdk';
import { Command } from 'commander';
import crypto from 'crypto';
import fs from 'fs';

// Aleo via official Provable SDK
// Note: initializeWasm is safe to call in Node; required in browsers.

type AleoAccount = {
  privateKey: string;
  viewKey: string;
  address: string;
};

function toAccountJson(account: Account): AleoAccount {
  return {
    privateKey:
      // Some SDK versions expose to_string(); fallback to String(obj)
      (account.privateKey() as any)?.to_string?.() ?? String(account.privateKey()),
    viewKey: (account.viewKey() as any)?.to_string?.() ?? String(account.viewKey()),
    address: (account.address() as any)?.to_string?.() ?? String(account.address()),
  };
}

function encryptData(password: string, data: Buffer) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { salt: salt.toString('hex'), iv: iv.toString('hex'), tag: tag.toString('hex'), data: enc.toString('hex') };
}

function decryptData(password: string, payload: { salt: string; iv: string; tag: string; data: string }) {
  const key = crypto.scryptSync(password, Buffer.from(payload.salt, 'hex'), 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  const dec = Buffer.concat([decipher.update(Buffer.from(payload.data, 'hex')), decipher.final()]);
  return dec;
}

export function aleoCommands() {
  const cmd = new Command('aleo').description('Aleo wallet operations');

  cmd
    .command('create')
    .description('Create a new Aleo wallet (official SDK)')
    .option('-p, --password <password>', 'Optional password to encrypt keyfile')
    .option('-o, --out <path>', 'Write to file instead of stdout')
  .action(async (opts: { password?: string; out?: string }) => {
      const account = new Account();
      const data = toAccountJson(account);
      let output: any = { type: 'aleo-account', ...data };
      if (opts.password) {
        const enc = encryptData(opts.password, Buffer.from(JSON.stringify(data)));
        output = { type: 'encrypted-aleo-account', ...enc };
      }
      const json = JSON.stringify(output, null, 2);
      if (opts.out) fs.writeFileSync(opts.out, json);
      else console.log(json);
    });

  cmd
    .command('import')
    .description('Import Aleo wallet from encrypted keyfile or private key (official SDK)')
    .option('-f, --file <path>', 'Encrypted keyfile JSON')
    .option('-p, --password <password>', 'Password for keyfile')
    .option('-k, --private-key <str>', 'Aleo private key string')
  .action(async (opts: { file?: string; password?: string; privateKey?: string }) => {
      if (opts.file) {
        if (!opts.password) throw new Error('Password is required to decrypt keyfile');
        const raw = JSON.parse(fs.readFileSync(opts.file, 'utf8'));
        // If file is already plaintext (type: aleo-account), just echo it
        if (raw && raw.type === 'aleo-account' && raw.address && raw.privateKey) {
          console.log(JSON.stringify(raw, null, 2));
          return;
        }
        const buf = decryptData(opts.password, raw);
        const parsed = JSON.parse(buf.toString('utf8')) as AleoAccount;
        console.log(JSON.stringify(parsed, null, 2));
        return;
      }
      if (opts.privateKey) {
        // Prefer the documented factory: Account.from_string({ privateKey })
        const account = (Account as any).from_string
          ? (Account as any).from_string({ privateKey: String(opts.privateKey) })
          : new Account({ privateKey: String(opts.privateKey) } as any);
        console.log(JSON.stringify(toAccountJson(account as Account), null, 2));
        return;
      }
      throw new Error('Provide --file with --password, or --private-key');
    });

  cmd
    .command('export')
    .description('Export Aleo wallet to encrypted keyfile (official SDK)')
    .requiredOption('-k, --private-key <str>', 'Aleo private key string')
    .requiredOption('-p, --password <password>', 'Password to encrypt')
    .option('-o, --out <path>', 'Output file path')
  .action(async (opts: { privateKey: string; password: string; out?: string }) => {
      const account = (Account as any).from_string
        ? (Account as any).from_string({ privateKey: String(opts.privateKey) })
        : new Account({ privateKey: String(opts.privateKey) } as any);
      const data = toAccountJson(account as Account);
      const enc = encryptData(opts.password, Buffer.from(JSON.stringify(data)));
      const json = JSON.stringify(enc, null, 2);
      if (opts.out) fs.writeFileSync(opts.out, json);
      else console.log(json);
    });

  return cmd;
}

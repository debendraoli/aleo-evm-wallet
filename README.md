# evm-aleo-create-wallet

A TypeScript CLI to create, import, and export EVM and Aleo wallets.

Status: EVM is production-ready via `ethers`. Aleo now uses the official `@provablehq/sdk` to generate valid Aleo keys and addresses (aleo1...).

## Install deps and build

```bash
npm install
npm run build
```

## Usage

```bash
# Show help
node dist/cli.js --help

# EVM wallets
node dist/cli.js evm create
node dist/cli.js evm import --mnemonic "word ..." --derivation-path "m/44'/60'/0'/0/0"
node dist/cli.js evm import --private-key 0x...
node dist/cli.js evm export --private-key 0x... --password "pass"

# Aleo wallets (official SDK)
# Create a new account (prints privateKey, viewKey, address)
node dist/cli.js aleo create

# Create and write encrypted keyfile
node dist/cli.js aleo create --password "pass" --out aleo.key

# Import from encrypted keyfile
node dist/cli.js aleo import --file aleo.key --password "pass"

# Import from an Aleo private key string
node dist/cli.js aleo import --private-key APrivateKey1...

# Export to encrypted keyfile from Aleo private key string
node dist/cli.js aleo export --private-key APrivateKey1... --password "pass" --out aleo.key
```

## Global install (optional)

```bash
npm link
wallet-cli --help
```

## Notes

- Aleo addresses start with `aleo1...` and can be searched on the public explorer. The `privateKey` starts with `APrivateKey...` and `viewKey` with `AViewKey...`.
- The Aleo SDK does not require manual WASM initialization in Node environments.
- Never share mnemonics or private keys. Use strong passwords.

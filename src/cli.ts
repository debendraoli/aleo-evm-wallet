#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { aleoCommands } from './commands/aleo.js';
import { evmCommands } from './commands/evm.js';

const program = new Command();

program
  .name('wallet-cli')
  .description('Create, import, and export EVM and Aleo wallets')
  .version('0.1.0');

program.addCommand(evmCommands());
program.addCommand(aleoCommands());

program.showHelpAfterError();

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red(err?.message || String(err)));
  process.exit(1);
});

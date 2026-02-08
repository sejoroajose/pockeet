#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('🧹 Cleaning build artifacts...\n');

  const suiDir = path.join(__dirname, '..', 'sui');
  const buildDir = path.join(suiDir, 'build');
  const lockFile = path.join(suiDir, 'Move.lock');

  let cleaned = false;

  // Remove build directory
  if (fs.existsSync(buildDir)) {
    try {
      fs.rmSync(buildDir, { recursive: true, force: true });
      console.log('✅ Removed build directory');
      cleaned = true;
    } catch (error: any) {
      console.error('❌ Failed to remove build directory:', error.message);
    }
  }

  // Remove Move.lock
  if (fs.existsSync(lockFile)) {
    try {
      fs.unlinkSync(lockFile);
      console.log('✅ Removed Move.lock');
      cleaned = true;
    } catch (error: any) {
      console.error('❌ Failed to remove Move.lock:', error.message);
    }
  }

  if (!cleaned) {
    console.log('ℹ️  No build artifacts found');
  } else {
    console.log('\n✨ Clean complete!');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

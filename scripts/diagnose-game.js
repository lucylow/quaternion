#!/usr/bin/env node
/**
 * Game Diagnostic Script
 * Checks for common issues that prevent the game from working
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const issues = [];
const warnings = [];
const info = [];

// Check 1: Package.json dependencies
console.log('🔍 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const requiredDeps = ['phaser', 'react', 'react-dom', 'react-router-dom'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length > 0) {
    issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
  } else {
    info.push('✅ All required dependencies are listed in package.json');
  }
} catch (error) {
  issues.push(`Failed to read package.json: ${error.message}`);
}

// Check 2: Node modules installation
console.log('🔍 Checking node_modules...');
const nodeModulesPath = path.join(__dirname, '../node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  issues.push('node_modules directory not found. Run: npm install');
} else {
  const phaserPath = path.join(nodeModulesPath, 'phaser');
  if (!fs.existsSync(phaserPath)) {
    issues.push('Phaser not installed. Run: npm install');
  } else {
    info.push('✅ Phaser is installed');
  }
}

// Check 3: Environment variables (optional)
console.log('🔍 Checking environment variables...');
const envFiles = ['.env', '.env.local', '.env.development'];
let envFound = false;
for (const envFile of envFiles) {
  const envPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(envPath)) {
    envFound = true;
    const envContent = fs.readFileSync(envPath, 'utf8');
    // Check for common required vars
    if (envContent.includes('VITE_SUPABASE_URL') || envContent.includes('VITE_ELEVENLABS')) {
      info.push(`✅ Found ${envFile} with API keys`);
    }
    break;
  }
}
if (!envFound) {
  warnings.push('No .env file found. Some features may not work without API keys.');
}

// Check 4: Main entry files
console.log('🔍 Checking entry files...');
const entryFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'src/pages/QuaternionGame.tsx',
  'index.html'
];
for (const file of entryFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    issues.push(`Missing file: ${file}`);
  } else {
    info.push(`✅ Found ${file}`);
  }
}

// Check 5: Game container in QuaternionGame
console.log('🔍 Checking game container setup...');
try {
  const gameFile = fs.readFileSync(path.join(__dirname, '../src/pages/QuaternionGame.tsx'), 'utf8');
  if (!gameFile.includes('ref={gameRef}')) {
    issues.push('Game container ref not found in QuaternionGame.tsx');
  } else {
    info.push('✅ Game container ref found');
  }
  
  if (!gameFile.includes('new Phaser.Game')) {
    issues.push('Phaser game initialization not found');
  } else {
    info.push('✅ Phaser game initialization found');
  }
  
  if (!gameFile.includes('phaserGameRef')) {
    warnings.push('phaserGameRef may not be properly set up');
  }
} catch (error) {
  issues.push(`Failed to check game file: ${error.message}`);
}

// Check 6: HTML root element
console.log('🔍 Checking HTML structure...');
try {
  const htmlFile = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  if (!htmlFile.includes('id="root"')) {
    issues.push('Root element with id="root" not found in index.html');
  } else {
    info.push('✅ Root element found in index.html');
  }
} catch (error) {
  issues.push(`Failed to check index.html: ${error.message}`);
}

// Check 7: Vite config
console.log('🔍 Checking Vite configuration...');
try {
  const viteConfig = fs.readFileSync(path.join(__dirname, '../vite.config.ts'), 'utf8');
  if (!viteConfig.includes('@/')) {
    warnings.push('Path alias @ may not be configured');
  } else {
    info.push('✅ Vite path aliases configured');
  }
} catch (error) {
  warnings.push(`Could not verify Vite config: ${error.message}`);
}

// Print results
console.log('\n' + '='.repeat(60));
console.log('DIAGNOSTIC RESULTS');
console.log('='.repeat(60));

if (info.length > 0) {
  console.log('\n✅ INFO:');
  info.forEach(msg => console.log(`   ${msg}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(msg => console.log(`   ${msg}`));
}

if (issues.length > 0) {
  console.log('\n❌ ISSUES FOUND:');
  issues.forEach(msg => console.log(`   ${msg}`));
  console.log('\n🔧 RECOMMENDED FIXES:');
  if (issues.some(i => i.includes('node_modules') || i.includes('not installed'))) {
    console.log('   1. Run: npm install');
  }
  if (issues.some(i => i.includes('Missing file'))) {
    console.log('   2. Check that all source files exist');
  }
  console.log('   3. Check browser console for runtime errors');
  console.log('   4. Verify the game container element exists in the DOM');
  console.log('   5. Ensure Phaser is properly initialized after React mounts');
  process.exit(1);
} else {
  console.log('\n✅ No critical issues found!');
  console.log('\n📝 NEXT STEPS:');
  console.log('   1. Run: npm run dev');
  console.log('   2. Open browser console (F12)');
  console.log('   3. Navigate to /game route');
  console.log('   4. Check for any console errors');
  console.log('   5. Verify Phaser game canvas appears');
  if (warnings.length > 0) {
    console.log('\n⚠️  Note: Some warnings may need attention for full functionality');
  }
  process.exit(0);
}


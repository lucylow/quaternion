#!/usr/bin/env node

/**
 * Generate Build Report
 * Automatically generates a build report with metrics from the production build
 */

const fs = require('fs');
const path = require('path');

const BUILD_REPORT_TEMPLATE = path.join(__dirname, '../BUILD_REPORT_TEMPLATE.md');
const DIST_DIR = path.join(__dirname, '../dist');

function getBuildSize() {
  if (!fs.existsSync(DIST_DIR)) {
    return { total: 0, breakdown: {} };
  }

  let total = 0;
  const breakdown = {
    js: 0,
    css: 0,
    images: 0,
    audio: 0,
    fonts: 0,
    other: 0,
  };

  function getDirSize(dir) {
    let size = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stat.size;
        const ext = path.extname(file).toLowerCase();
        
        if (ext === '.js') breakdown.js += stat.size;
        else if (ext === '.css') breakdown.css += stat.size;
        else if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(ext)) breakdown.images += stat.size;
        else if (/\.(mp3|wav|ogg|m4a)$/i.test(ext)) breakdown.audio += stat.size;
        else if (/\.(woff|woff2|ttf|otf|eot)$/i.test(ext)) breakdown.fonts += stat.size;
        else breakdown.other += stat.size;
      }
    }

    return size;
  }

  total = getDirSize(DIST_DIR);

  // Convert to MB
  return {
    total: total / 1024 / 1024,
    breakdown: {
      js: breakdown.js / 1024 / 1024,
      css: breakdown.css / 1024 / 1024,
      images: breakdown.images / 1024 / 1024,
      audio: breakdown.audio / 1024 / 1024,
      fonts: breakdown.fonts / 1024 / 1024,
      other: breakdown.other / 1024 / 1024,
    },
  };
}

function getChunkSizes() {
  const chunks = [];
  const assetsDir = path.join(DIST_DIR, 'assets', 'js');

  if (!fs.existsSync(assetsDir)) {
    return chunks;
  }

  const files = fs.readdirSync(assetsDir);
  
  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(assetsDir, file);
      const stat = fs.statSync(filePath);
      const size = stat.size / 1024; // KB
      chunks.push({
        name: file.replace(/-\w+\.js$/, ''), // Remove hash
        size: size,
      });
    }
  }

  return chunks.sort((a, b) => b.size - a.size);
}

function generateReport() {
  const buildSize = getBuildSize();
  const chunks = getChunkSizes();
  const version = require('../package.json').version;
  const buildDate = new Date().toISOString().split('T')[0];

  let report = fs.readFileSync(BUILD_REPORT_TEMPLATE, 'utf8');

  // Replace placeholders
  report = report.replace(/\[VERSION_NUMBER\]/g, version);
  report = report.replace(/\[BUILD_DATE\]/g, buildDate);
  report = report.replace(/\[BUILD_ID\]/g, Date.now().toString());

  // Replace build size metrics
  report = report.replace(/\[XX\] MB/g, buildSize.total.toFixed(2) + ' MB');
  
  // Add chunk breakdown
  const chunkTable = chunks.map(chunk => 
    `| ${chunk.name} | ${chunk.size.toFixed(2)} KB | - |`
  ).join('\n');

  // Insert chunk table after code splitting section
  const codeSplittingIndex = report.indexOf('### Code Splitting');
  if (codeSplittingIndex > -1) {
    const tableEnd = report.indexOf('---', codeSplittingIndex);
    if (tableEnd > -1) {
      report = report.slice(0, tableEnd) + '\n' + chunkTable + '\n' + report.slice(tableEnd);
    }
  }

  // Write report
  const outputPath = path.join(__dirname, '../BUILD_REPORT.md');
  fs.writeFileSync(outputPath, report);

  console.log('✅ Build report generated:', outputPath);
  console.log('📊 Total build size:', buildSize.total.toFixed(2), 'MB');
  console.log('📦 Chunks:', chunks.length);
}

// Run if called directly
if (require.main === module) {
  generateReport();
}

module.exports = { generateReport, getBuildSize, getChunkSizes };


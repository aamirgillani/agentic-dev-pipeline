#!/usr/bin/env node

/**
 * Smoke Tests - Critical Pre-Flight Checks
 *
 * These tests MUST pass before any other tests run. They verify:
 * 1. App can actually start (not just unit tests passing)
 * 2. Database is valid and accessible
 * 3. Critical files exist and are valid
 * 4. Dependencies are installed
 * 5. Environment is configured correctly
 *
 * Run: node workflows/smoke-tests.js --project=/path/to/project --config=project-name
 */

import { existsSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class SmokeTestRunner {
    constructor(projectPath, projectConfig) {
        this.projectPath = projectPath;
        this.projectConfig = projectConfig;
        this.results = {
            passed: [],
            failed: [],
            warnings: []
        };
    }

    log(type, message) {
        const icons = { pass: '✅', fail: '❌', warn: '⚠️', info: 'ℹ️' };
        console.log(`  ${icons[type] || '•'} ${message}`);
    }

    async runAll() {
        console.log('\n' + '═'.repeat(60));
        console.log('  SMOKE TESTS - Critical Pre-Flight Checks');
        console.log('═'.repeat(60) + '\n');

        // 1. File System Checks
        await this.runFileSystemChecks();

        // 2. Database Checks
        await this.runDatabaseChecks();

        // 3. Dependency Checks
        await this.runDependencyChecks();

        // 4. App Startup Check
        await this.runAppStartupCheck();

        // 5. Backend Import Check
        await this.runBackendImportCheck();

        // 6. Frontend Syntax Check
        await this.runFrontendSyntaxCheck();

        // 7. Frontend Static Analysis (undefined variables, etc.)
        await this.runFrontendStaticAnalysis();

        // Summary
        this.printSummary();

        return this.results.failed.length === 0;
    }

    async runFileSystemChecks() {
        console.log('📁 File System Checks\n');

        const criticalFiles = this.projectConfig?.smoke_tests?.critical_files || this.projectConfig?.critical_files || [
            'main.py',
            'package.json',
            'src/backend/database.py',
            'src/backend/bridge.py',
            'src/frontend/app.js',
            'src/frontend/index.html'
        ];

        for (const file of criticalFiles) {
            const fullPath = join(this.projectPath, file);
            if (existsSync(fullPath)) {
                const stats = statSync(fullPath);
                if (stats.size === 0) {
                    this.results.failed.push(`${file} exists but is empty`);
                    this.log('fail', `${file} - EXISTS BUT EMPTY`);
                } else {
                    this.results.passed.push(`${file} exists and has content`);
                    this.log('pass', `${file} (${stats.size} bytes)`);
                }
            } else {
                this.results.failed.push(`${file} is missing`);
                this.log('fail', `${file} - MISSING`);
            }
        }
        console.log();
    }

    async runDatabaseChecks() {
        console.log('🗄️  Database Checks\n');

        const dbFiles = this.projectConfig?.smoke_tests?.database_files || this.projectConfig?.database_files || ['legal_documents.db'];

        for (const dbFile of dbFiles) {
            const dbPath = join(this.projectPath, dbFile);

            if (!existsSync(dbPath)) {
                this.results.warnings.push(`${dbFile} does not exist (will be created on first run)`);
                this.log('warn', `${dbFile} - NOT FOUND (OK if first run)`);
                continue;
            }

            // Check if it's actually a SQLite file
            try {
                const header = readFileSync(dbPath, { encoding: null }).slice(0, 16);
                const headerStr = header.toString('utf8');

                if (headerStr.startsWith('SQLite format 3')) {
                    this.results.passed.push(`${dbFile} is valid SQLite database`);
                    this.log('pass', `${dbFile} - Valid SQLite 3.x database`);

                    // Try to open and query it
                    try {
                        const result = execSync(
                            `sqlite3 "${dbPath}" "SELECT count(*) FROM sqlite_master WHERE type='table';"`,
                            { cwd: this.projectPath, encoding: 'utf8', timeout: 5000 }
                        ).trim();
                        this.log('pass', `${dbFile} - ${result} tables accessible`);
                        this.results.passed.push(`${dbFile} is queryable`);
                    } catch (e) {
                        this.results.failed.push(`${dbFile} exists but cannot be queried: ${e.message}`);
                        this.log('fail', `${dbFile} - Cannot query: ${e.message}`);
                    }
                } else {
                    this.results.failed.push(`${dbFile} is CORRUPTED - not a valid SQLite file`);
                    this.log('fail', `${dbFile} - CORRUPTED (not SQLite format)`);
                    this.log('info', `  Header: "${headerStr.slice(0, 20)}..."`);
                    this.log('info', `  Fix: Delete the file and restart the app`);
                }
            } catch (e) {
                this.results.failed.push(`${dbFile} cannot be read: ${e.message}`);
                this.log('fail', `${dbFile} - Cannot read: ${e.message}`);
            }
        }
        console.log();
    }

    async runDependencyChecks() {
        console.log('📦 Dependency Checks\n');

        // Check Python dependencies
        if (existsSync(join(this.projectPath, 'requirements.txt'))) {
            try {
                execSync('python3 -c "import PyQt6; import sqlite3"', {
                    cwd: this.projectPath,
                    timeout: 10000,
                    stdio: 'pipe'
                });
                this.results.passed.push('Python core dependencies installed');
                this.log('pass', 'Python: PyQt6, sqlite3 available');
            } catch (e) {
                this.results.failed.push('Python dependencies missing');
                this.log('fail', 'Python dependencies missing');
                this.log('info', '  Run: pip install -r requirements.txt');
            }
        }

        // Check Node dependencies
        if (existsSync(join(this.projectPath, 'package.json'))) {
            const nodeModulesPath = join(this.projectPath, 'node_modules');
            if (existsSync(nodeModulesPath)) {
                this.results.passed.push('Node modules installed');
                this.log('pass', 'Node: node_modules exists');
            } else {
                this.results.warnings.push('Node modules not installed');
                this.log('warn', 'Node: node_modules missing');
                this.log('info', '  Run: npm install');
            }
        }

        console.log();
    }

    async runAppStartupCheck() {
        console.log('🚀 App Startup Check\n');

        const startupScript = this.projectConfig?.smoke_tests?.startup_check || this.projectConfig?.startup_check || `
import sys
sys.path.insert(0, 'src/backend')
from database import Database
from bridge import Bridge
db = Database()
bridge = Bridge(db)
print('STARTUP_OK')
`;

        try {
            const result = execSync(`python3 -c "${startupScript}"`, {
                cwd: this.projectPath,
                timeout: 30000,
                encoding: 'utf8',
                stdio: ['pipe', 'pipe', 'pipe']
            });

            if (result.includes('STARTUP_OK')) {
                this.results.passed.push('App backend initializes successfully');
                this.log('pass', 'Backend initializes without errors');
            } else {
                this.results.warnings.push('App started but no confirmation');
                this.log('warn', 'Backend started but output unclear');
            }
        } catch (e) {
            this.results.failed.push(`App startup FAILED: ${e.message}`);
            this.log('fail', 'Backend FAILED to initialize');

            // Parse the error for common issues
            const stderr = e.stderr?.toString() || e.message;
            if (stderr.includes('file is not a database')) {
                this.log('info', '  Cause: Database file is corrupted');
                this.log('info', '  Fix: Delete the .db file and restart');
            } else if (stderr.includes('ModuleNotFoundError')) {
                const match = stderr.match(/No module named '(\w+)'/);
                this.log('info', `  Cause: Missing module ${match?.[1] || 'unknown'}`);
                this.log('info', '  Fix: pip install -r requirements.txt');
            } else if (stderr.includes('SyntaxError')) {
                this.log('info', '  Cause: Python syntax error');
            } else {
                this.log('info', `  Error: ${stderr.slice(0, 200)}`);
            }
        }

        console.log();
    }

    async runBackendImportCheck() {
        console.log('🐍 Backend Import Check\n');

        const backendModules = this.projectConfig?.smoke_tests?.backend_modules || this.projectConfig?.backend_modules || [
            'database',
            'bridge'
        ];

        for (const module of backendModules) {
            try {
                execSync(`python3 -c "import sys; sys.path.insert(0, 'src/backend'); import ${module}"`, {
                    cwd: this.projectPath,
                    timeout: 10000,
                    stdio: 'pipe'
                });
                this.results.passed.push(`Backend module ${module} imports`);
                this.log('pass', `${module}.py imports successfully`);
            } catch (e) {
                this.results.failed.push(`Backend module ${module} fails to import`);
                this.log('fail', `${module}.py import FAILED`);
            }
        }

        console.log();
    }

    async runFrontendSyntaxCheck() {
        console.log('🌐 Frontend Syntax Check\n');

        const jsFiles = this.projectConfig?.smoke_tests?.frontend_js || this.projectConfig?.frontend_js || ['src/frontend/app.js'];

        for (const jsFile of jsFiles) {
            const fullPath = join(this.projectPath, jsFile);
            if (!existsSync(fullPath)) {
                this.results.warnings.push(`${jsFile} not found`);
                this.log('warn', `${jsFile} - not found`);
                continue;
            }

            try {
                // Basic syntax check with Node
                execSync(`node --check "${fullPath}"`, {
                    cwd: this.projectPath,
                    timeout: 10000,
                    stdio: 'pipe'
                });
                this.results.passed.push(`${jsFile} syntax valid`);
                this.log('pass', `${jsFile} - syntax OK`);
            } catch (e) {
                this.results.failed.push(`${jsFile} has syntax errors`);
                this.log('fail', `${jsFile} - SYNTAX ERROR`);
                this.log('info', `  ${e.stderr?.toString().slice(0, 200) || e.message}`);
            }
        }

        console.log();
    }

    async runFrontendStaticAnalysis() {
        console.log('🔍 Frontend Static Analysis (undefined variables)\n');

        const jsFiles = this.projectConfig?.smoke_tests?.frontend_js || this.projectConfig?.frontend_js || ['src/frontend/app.js'];
        const globalVars = this.projectConfig?.smoke_tests?.frontend_globals || this.projectConfig?.frontend_globals || [];

        // Build globals string for ESLint (e.g., "QWebChannel:readonly,qt:readonly")
        const globalsArg = globalVars.length > 0
            ? `--global "${globalVars.join(':readonly,') + ':readonly'}"`
            : '';

        for (const jsFile of jsFiles) {
            const fullPath = join(this.projectPath, jsFile);
            if (!existsSync(fullPath)) {
                continue; // Already warned in syntax check
            }

            try {
                // Run ESLint with no-undef rule to catch undefined variables
                // This catches errors like "inheritorsList is not defined"
                const eslintCmd = `npx eslint --no-eslintrc --env browser,es2021 ${globalsArg} --rule "no-undef: error" --format compact "${fullPath}"`;
                execSync(eslintCmd, {
                    cwd: this.projectPath,
                    timeout: 30000,
                    stdio: 'pipe'
                });
                this.results.passed.push(`${jsFile} no undefined variables`);
                this.log('pass', `${jsFile} - no undefined variables`);
            } catch (e) {
                const output = e.stdout?.toString() || e.stderr?.toString() || '';
                // Count undefined variable errors
                const undefErrors = (output.match(/is not defined/g) || []).length;

                if (undefErrors > 0) {
                    // This is a FAILURE - undefined variables cause runtime errors
                    this.results.failed.push(`${jsFile} has ${undefErrors} undefined variable(s)`);
                    this.log('fail', `${jsFile} - ${undefErrors} undefined variable(s) detected`);

                    // Show first few errors
                    const lines = output.split('\n').filter(l => l.includes('is not defined')).slice(0, 5);
                    lines.forEach(line => {
                        const match = line.match(/'([^']+)' is not defined/);
                        if (match) {
                            this.log('info', `    → ${match[1]} is not defined`);
                        }
                    });
                } else {
                    // Other ESLint issues (not undefined vars)
                    this.results.passed.push(`${jsFile} no undefined variables`);
                    this.log('pass', `${jsFile} - no undefined variables`);
                }
            }
        }

        console.log();
    }

    printSummary() {
        console.log('═'.repeat(60));
        console.log('  SMOKE TEST SUMMARY');
        console.log('═'.repeat(60) + '\n');

        console.log(`  ✅ Passed:   ${this.results.passed.length}`);
        console.log(`  ❌ Failed:   ${this.results.failed.length}`);
        console.log(`  ⚠️  Warnings: ${this.results.warnings.length}`);

        if (this.results.failed.length > 0) {
            console.log('\n  FAILURES (must fix before proceeding):');
            this.results.failed.forEach(f => console.log(`    • ${f}`));
        }

        if (this.results.warnings.length > 0) {
            console.log('\n  WARNINGS (review recommended):');
            this.results.warnings.forEach(w => console.log(`    • ${w}`));
        }

        console.log('\n' + '═'.repeat(60));

        if (this.results.failed.length === 0) {
            console.log('  ✅ SMOKE TESTS PASSED - Safe to run full test suite');
        } else {
            console.log('  ❌ SMOKE TESTS FAILED - Fix issues before running tests');
            process.exitCode = 1;
        }

        console.log('═'.repeat(60) + '\n');
    }
}

// CLI execution
async function main() {
    const args = process.argv.slice(2);

    let projectPath = process.cwd();
    let projectConfigName = null;

    for (const arg of args) {
        if (arg.startsWith('--project=')) {
            projectPath = arg.replace('--project=', '');
        } else if (arg.startsWith('--config=')) {
            projectConfigName = arg.replace('--config=', '');
        }
    }

    // Load project config if specified
    let projectConfig = null;
    if (projectConfigName) {
        const configPath = join(__dirname, '..', 'config', 'project-context', `${projectConfigName}.json`);
        if (existsSync(configPath)) {
            projectConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
            console.log(`Loaded project config: ${projectConfigName}`);
        }
    }

    const runner = new SmokeTestRunner(projectPath, projectConfig);
    await runner.runAll();
}

main().catch(console.error);

export { SmokeTestRunner };

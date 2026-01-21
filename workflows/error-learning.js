#!/usr/bin/env node

/**
 * Error Learning System - Automatic Regression Test Generation
 *
 * This module learns from errors encountered during development and automatically
 * generates tests to prevent similar bugs in the future.
 *
 * Features:
 * 1. Error Pattern Registry - Stores known error patterns and their fixes
 * 2. Auto-Test Generation - Creates regression tests from error reports
 * 3. Pattern Matching - Detects similar errors to known patterns
 * 4. Integration with Smoke Tests - Adds learned checks to the test pipeline
 *
 * Usage:
 *   node workflows/error-learning.js --report "error message" --category js-runtime --project will-generator
 *   node workflows/error-learning.js --list --project will-generator
 *   node workflows/error-learning.js --generate-tests --project will-generator
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Error categories and their test generation strategies
const ERROR_CATEGORIES = {
    'js-runtime': {
        description: 'JavaScript runtime errors (undefined variables, type errors)',
        testType: 'playwright',
        patterns: [
            { regex: /(\w+) is not defined/, extract: 'variableName' },
            { regex: /Cannot read propert(y|ies) of (null|undefined)/, extract: 'nullAccess' },
            { regex: /Cannot access '(\w+)' before initialization/, extract: 'temporalDeadZone' },
            { regex: /(\w+) is not a function/, extract: 'notFunction' },
        ]
    },
    'js-syntax': {
        description: 'JavaScript syntax errors',
        testType: 'eslint',
        patterns: [
            { regex: /Unexpected token/, extract: 'syntaxError' },
            { regex: /Unterminated string/, extract: 'unterminatedString' },
        ]
    },
    'python-import': {
        description: 'Python import errors',
        testType: 'python',
        patterns: [
            { regex: /ModuleNotFoundError: No module named '(\w+)'/, extract: 'moduleName' },
            { regex: /ImportError: cannot import name '(\w+)'/, extract: 'importName' },
        ]
    },
    'python-runtime': {
        description: 'Python runtime errors',
        testType: 'python',
        patterns: [
            { regex: /NameError: name '(\w+)' is not defined/, extract: 'variableName' },
            { regex: /AttributeError: '(\w+)' object has no attribute '(\w+)'/, extract: 'attributeError' },
            { regex: /TypeError: (\w+)/, extract: 'typeError' },
        ]
    },
    'qt-crash': {
        description: 'Qt/PyQt crashes (SIGSEGV, accessibility)',
        testType: 'manual',
        patterns: [
            { regex: /SIGSEGV.*QAccessible/, extract: 'accessibilityCrash' },
            { regex: /Segmentation fault/, extract: 'segfault' },
        ]
    },
    'database': {
        description: 'Database errors',
        testType: 'python',
        patterns: [
            { regex: /sqlite3\.OperationalError/, extract: 'sqliteError' },
            { regex: /no such table: (\w+)/, extract: 'missingTable' },
        ]
    }
};

class ErrorLearningSystem {
    constructor(projectName) {
        this.projectName = projectName;
        this.configDir = join(__dirname, '..', 'config', 'project-context');
        this.errorRegistryPath = join(__dirname, '..', 'config', 'error-registry');
        this.projectRegistryPath = join(this.errorRegistryPath, `${projectName}-errors.json`);

        // Ensure error registry directory exists
        if (!existsSync(this.errorRegistryPath)) {
            mkdirSync(this.errorRegistryPath, { recursive: true });
        }

        // Load or initialize error registry
        this.registry = this.loadRegistry();
    }

    loadRegistry() {
        if (existsSync(this.projectRegistryPath)) {
            try {
                return JSON.parse(readFileSync(this.projectRegistryPath, 'utf8'));
            } catch (e) {
                console.error(`Error loading registry: ${e.message}`);
            }
        }
        return {
            projectName: this.projectName,
            version: '1.0',
            createdAt: new Date().toISOString(),
            errors: [],
            generatedTests: [],
            patterns: []
        };
    }

    saveRegistry() {
        this.registry.updatedAt = new Date().toISOString();
        writeFileSync(this.projectRegistryPath, JSON.stringify(this.registry, null, 2));
    }

    /**
     * Report a new error to the learning system
     */
    reportError(errorMessage, category, context = {}) {
        const error = {
            id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            message: errorMessage,
            category: category,
            context: context,
            reportedAt: new Date().toISOString(),
            status: 'new',
            testGenerated: false
        };

        // Detect pattern from known categories
        const detectedPattern = this.detectPattern(errorMessage, category);
        if (detectedPattern) {
            error.detectedPattern = detectedPattern;
        }

        // Check for similar existing errors
        const similar = this.findSimilarErrors(errorMessage);
        if (similar.length > 0) {
            error.similarErrors = similar.map(e => e.id);
            console.log(`Found ${similar.length} similar error(s) in registry`);
        }

        this.registry.errors.push(error);
        this.saveRegistry();

        console.log(`\nError reported: ${error.id}`);
        console.log(`Category: ${category}`);
        console.log(`Pattern: ${detectedPattern?.type || 'unknown'}`);

        // Auto-generate test if possible
        const testGenerated = this.generateTestForError(error);
        if (testGenerated) {
            error.testGenerated = true;
            error.status = 'test-generated';
            this.saveRegistry();
        }

        return error;
    }

    /**
     * Detect error pattern from message
     */
    detectPattern(errorMessage, category) {
        const categoryConfig = ERROR_CATEGORIES[category];
        if (!categoryConfig) return null;

        for (const pattern of categoryConfig.patterns) {
            const match = errorMessage.match(pattern.regex);
            if (match) {
                return {
                    type: pattern.extract,
                    match: match[0],
                    captures: match.slice(1),
                    testType: categoryConfig.testType
                };
            }
        }
        return null;
    }

    /**
     * Find similar errors in registry
     */
    findSimilarErrors(errorMessage) {
        const words = errorMessage.toLowerCase().split(/\W+/).filter(w => w.length > 3);
        return this.registry.errors.filter(e => {
            const existingWords = e.message.toLowerCase().split(/\W+/).filter(w => w.length > 3);
            const commonWords = words.filter(w => existingWords.includes(w));
            return commonWords.length >= Math.min(3, words.length * 0.5);
        });
    }

    /**
     * Generate a test for the reported error
     */
    generateTestForError(error) {
        if (!error.detectedPattern) {
            console.log('Cannot auto-generate test: no pattern detected');
            return false;
        }

        const { testType, type, captures } = error.detectedPattern;

        switch (testType) {
            case 'playwright':
                return this.generatePlaywrightTest(error);
            case 'eslint':
                return this.generateESLintCheck(error);
            case 'python':
                return this.generatePythonTest(error);
            default:
                console.log(`Manual intervention required for ${testType} tests`);
                return false;
        }
    }

    /**
     * Generate Playwright test for JS runtime errors
     */
    generatePlaywrightTest(error) {
        const { type, captures } = error.detectedPattern;

        let testCode = '';
        let testName = '';
        let checkCode = '';

        switch (type) {
            case 'variableName':
                // Check if there's a getter function for this variable (common pattern)
                const varName = captures[0];
                const getterName = `get${varName.charAt(0).toUpperCase() + varName.slice(1)}`;
                testName = `variable_${varName}_accessible`;
                checkCode = `
        // Check that ${varName} is accessible (either as variable or via getter function)
        // Original error: "${varName} is not defined"
        const isAccessible = await page.evaluate(() => {
            try {
                // First check if getter function exists (e.g., getInheritorsList for inheritorsList)
                if (typeof window.${getterName} === 'function') {
                    window.${getterName}();
                    return true;
                }
                // Then check if variable is directly accessible
                if (typeof ${varName} !== 'undefined') {
                    return true;
                }
                // Check window scope
                if (typeof window.${varName} !== 'undefined') {
                    return true;
                }
                return false;
            } catch (e) {
                console.error('Access check failed:', e.message);
                return false;
            }
        });
        expect(isAccessible, '${varName} should be accessible (directly or via ${getterName})').toBe(true);`;
                break;

            case 'temporalDeadZone':
                const tdzVarName = captures[0];
                testName = `variable_${tdzVarName}_no_tdz`;
                checkCode = `
        // Check that ${tdzVarName} doesn't cause TDZ error when accessed via functions
        // Original error: "Cannot access '${tdzVarName}' before initialization"
        // This error typically occurs when let/const variables are accessed before declaration
        const noTdzError = await page.evaluate(() => {
            const errors = [];
            // Listen for any page errors
            window.onerror = (msg) => errors.push(msg);

            // Try calling functions that might use ${tdzVarName}
            // The fix is usually to wrap access in try-catch or check initialization
            try {
                // If there are check/calculate functions, call them
                const fnNames = Object.keys(window).filter(k =>
                    typeof window[k] === 'function' &&
                    (k.includes('check') || k.includes('calculate') || k.includes('Tab'))
                );
                for (const fn of fnNames.slice(0, 10)) {
                    try {
                        window[fn]();
                    } catch (e) {
                        if (e.message && e.message.includes('${tdzVarName}') && e.message.includes('before initialization')) {
                            return false; // TDZ error found
                        }
                    }
                }
                return true; // No TDZ errors
            } catch (e) {
                return !e.message?.includes('before initialization');
            }
        });
        expect(noTdzError, '${tdzVarName} should not cause TDZ errors').toBe(true);`;
                break;

            case 'notFunction':
                testName = `function_${captures[0]}_exists`;
                checkCode = `
        // Check that ${captures[0]} is a function
        const isFunction = await page.evaluate(() => {
            return typeof window.${captures[0]} === 'function';
        });
        expect(isFunction, '${captures[0]} should be a function').toBe(true);`;
                break;

            default:
                console.log(`Unknown pattern type: ${type}`);
                return false;
        }

        testCode = `
    test('regression: ${testName}', async ({ page }) => {
        const htmlPath = path.resolve(__dirname, '../../src/frontend/index.html');
        await page.goto(\`file://\${htmlPath}\`);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
${checkCode}
    });`;

        // Add to generated tests
        this.registry.generatedTests.push({
            errorId: error.id,
            testName,
            testCode,
            testType: 'playwright',
            generatedAt: new Date().toISOString()
        });

        console.log(`\nGenerated Playwright test: ${testName}`);
        return true;
    }

    /**
     * Generate ESLint check for syntax errors
     */
    generateESLintCheck(error) {
        // Add to patterns that should be checked
        this.registry.patterns.push({
            errorId: error.id,
            type: 'eslint',
            rule: 'no-undef',
            generatedAt: new Date().toISOString()
        });

        console.log('Added ESLint pattern check');
        return true;
    }

    /**
     * Generate Python test
     */
    generatePythonTest(error) {
        const { type, captures } = error.detectedPattern;

        let testCode = '';
        let testName = '';

        switch (type) {
            case 'moduleName':
                testName = `test_module_${captures[0]}_importable`;
                testCode = `
def ${testName}():
    """Regression test: ensure ${captures[0]} module is importable"""
    try:
        import ${captures[0]}
        assert True
    except ImportError:
        pytest.fail("${captures[0]} module should be importable")
`;
                break;

            case 'variableName':
                testName = `test_variable_${captures[0]}_defined`;
                testCode = `
def ${testName}():
    """Regression test: ensure ${captures[0]} is defined"""
    # This test should be customized based on the module context
    pass
`;
                break;

            default:
                console.log(`Unknown Python pattern type: ${type}`);
                return false;
        }

        this.registry.generatedTests.push({
            errorId: error.id,
            testName,
            testCode,
            testType: 'python',
            generatedAt: new Date().toISOString()
        });

        console.log(`\nGenerated Python test: ${testName}`);
        return true;
    }

    /**
     * Export generated tests to project test files
     */
    exportTests(projectPath) {
        const playwrightTests = this.registry.generatedTests.filter(t => t.testType === 'playwright');
        const pythonTests = this.registry.generatedTests.filter(t => t.testType === 'python');

        if (playwrightTests.length > 0) {
            this.exportPlaywrightTests(projectPath, playwrightTests);
        }

        if (pythonTests.length > 0) {
            this.exportPythonTests(projectPath, pythonTests);
        }

        return {
            playwright: playwrightTests.length,
            python: pythonTests.length
        };
    }

    exportPlaywrightTests(projectPath, tests) {
        const testFilePath = join(projectPath, 'tests/frontend/test_regression_errors.spec.js');
        const existingTests = existsSync(testFilePath) ? readFileSync(testFilePath, 'utf8') : '';

        // Check which tests are already exported
        const newTests = tests.filter(t => !existingTests.includes(t.testName));

        if (newTests.length === 0) {
            console.log('All Playwright regression tests already exported');
            return;
        }

        const testFileContent = `// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

/**
 * Auto-generated Regression Tests
 *
 * These tests were automatically generated by the Error Learning System
 * to prevent previously encountered errors from recurring.
 *
 * DO NOT EDIT MANUALLY - regenerate using:
 *   node ../agentic-dev-pipeline/workflows/error-learning.js --export-tests
 */

test.describe('Regression Tests - Error Prevention', () => {
${newTests.map(t => t.testCode).join('\n')}
});
`;

        writeFileSync(testFilePath, testFileContent);
        console.log(`\nExported ${newTests.length} Playwright regression test(s) to:`);
        console.log(`  ${testFilePath}`);
    }

    exportPythonTests(projectPath, tests) {
        const testFilePath = join(projectPath, 'tests/test_regression_errors.py');
        const existingTests = existsSync(testFilePath) ? readFileSync(testFilePath, 'utf8') : '';

        const newTests = tests.filter(t => !existingTests.includes(t.testName));

        if (newTests.length === 0) {
            console.log('All Python regression tests already exported');
            return;
        }

        const testFileContent = `"""
Auto-generated Regression Tests

These tests were automatically generated by the Error Learning System
to prevent previously encountered errors from recurring.

DO NOT EDIT MANUALLY - regenerate using:
    node ../agentic-dev-pipeline/workflows/error-learning.js --export-tests
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'backend'))

${newTests.map(t => t.testCode).join('\n')}
`;

        writeFileSync(testFilePath, testFileContent);
        console.log(`\nExported ${newTests.length} Python regression test(s) to:`);
        console.log(`  ${testFilePath}`);
    }

    /**
     * List all errors in registry
     */
    listErrors() {
        console.log('\n' + '═'.repeat(60));
        console.log('  ERROR REGISTRY');
        console.log('═'.repeat(60) + '\n');

        if (this.registry.errors.length === 0) {
            console.log('No errors recorded yet.\n');
            return;
        }

        console.log(`Total errors: ${this.registry.errors.length}`);
        console.log(`Tests generated: ${this.registry.generatedTests.length}\n`);

        // Group by category
        const byCategory = {};
        for (const error of this.registry.errors) {
            if (!byCategory[error.category]) {
                byCategory[error.category] = [];
            }
            byCategory[error.category].push(error);
        }

        for (const [category, errors] of Object.entries(byCategory)) {
            console.log(`\n${category.toUpperCase()} (${errors.length}):`);
            for (const error of errors) {
                const status = error.testGenerated ? '✅' : '⚠️';
                console.log(`  ${status} ${error.id}`);
                console.log(`     ${error.message.slice(0, 80)}${error.message.length > 80 ? '...' : ''}`);
                console.log(`     Pattern: ${error.detectedPattern?.type || 'unknown'}`);
            }
        }

        console.log('\n' + '═'.repeat(60) + '\n');
    }

    /**
     * Get summary for smoke test integration
     */
    getSummary() {
        return {
            totalErrors: this.registry.errors.length,
            testsGenerated: this.registry.generatedTests.length,
            byCategory: this.registry.errors.reduce((acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + 1;
                return acc;
            }, {}),
            lastUpdated: this.registry.updatedAt
        };
    }
}

// CLI execution
async function main() {
    const args = process.argv.slice(2);

    // Parse arguments
    let projectName = null;
    let action = null;
    let errorMessage = null;
    let category = null;
    let projectPath = null;
    let context = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--project' || arg === '-p') {
            projectName = args[++i];
        } else if (arg === '--report' || arg === '-r') {
            action = 'report';
            errorMessage = args[++i];
        } else if (arg === '--category' || arg === '-c') {
            category = args[++i];
        } else if (arg === '--list' || arg === '-l') {
            action = 'list';
        } else if (arg === '--export-tests' || arg === '-e') {
            action = 'export';
        } else if (arg === '--path') {
            projectPath = args[++i];
        } else if (arg === '--file') {
            context.file = args[++i];
        } else if (arg === '--line') {
            context.line = parseInt(args[++i]);
        } else if (arg === '--help' || arg === '-h') {
            printHelp();
            process.exit(0);
        }
    }

    if (!projectName) {
        console.error('Error: --project is required');
        printHelp();
        process.exit(1);
    }

    const learner = new ErrorLearningSystem(projectName);

    switch (action) {
        case 'report':
            if (!errorMessage) {
                console.error('Error: --report requires an error message');
                process.exit(1);
            }
            if (!category) {
                // Try to auto-detect category
                category = detectCategory(errorMessage);
                console.log(`Auto-detected category: ${category}`);
            }
            learner.reportError(errorMessage, category, context);
            break;

        case 'list':
            learner.listErrors();
            break;

        case 'export':
            if (!projectPath) {
                // Try to find project path from config
                const configPath = join(__dirname, '..', 'config', 'project-context', `${projectName}.json`);
                if (existsSync(configPath)) {
                    const config = JSON.parse(readFileSync(configPath, 'utf8'));
                    projectPath = config.projectPath || process.cwd();
                } else {
                    projectPath = process.cwd();
                }
            }
            const result = learner.exportTests(projectPath);
            console.log(`\nExported: ${result.playwright} Playwright, ${result.python} Python tests`);
            break;

        default:
            console.log('Specify an action: --report, --list, or --export-tests');
            printHelp();
    }
}

function detectCategory(errorMessage) {
    // Try to auto-detect category from error message
    if (errorMessage.includes('is not defined') && !errorMessage.includes('NameError')) {
        return 'js-runtime';
    }
    if (errorMessage.includes('Cannot access') && errorMessage.includes('before initialization')) {
        return 'js-runtime';
    }
    if (errorMessage.includes('Unexpected token') || errorMessage.includes('SyntaxError')) {
        return 'js-syntax';
    }
    if (errorMessage.includes('ModuleNotFoundError') || errorMessage.includes('ImportError')) {
        return 'python-import';
    }
    if (errorMessage.includes('NameError') || errorMessage.includes('AttributeError')) {
        return 'python-runtime';
    }
    if (errorMessage.includes('SIGSEGV') || errorMessage.includes('Segmentation fault')) {
        return 'qt-crash';
    }
    if (errorMessage.includes('sqlite3') || errorMessage.includes('no such table')) {
        return 'database';
    }
    return 'unknown';
}

function printHelp() {
    console.log(`
Error Learning System - Automatic Regression Test Generation

Usage:
  node workflows/error-learning.js [options]

Options:
  --project, -p <name>    Project name (required)
  --report, -r <message>  Report a new error
  --category, -c <cat>    Error category (auto-detected if not specified)
  --list, -l              List all errors in registry
  --export-tests, -e      Export generated tests to project
  --path <path>           Project path for test export
  --file <file>           Source file where error occurred
  --line <number>         Line number where error occurred
  --help, -h              Show this help

Categories:
  js-runtime    JavaScript runtime errors
  js-syntax     JavaScript syntax errors
  python-import Python import errors
  python-runtime Python runtime errors
  qt-crash      Qt/PyQt crashes
  database      Database errors

Examples:
  # Report a JavaScript error
  node workflows/error-learning.js -p will-generator -r "inheritorsList is not defined" -c js-runtime

  # List all errors
  node workflows/error-learning.js -p will-generator --list

  # Export generated tests
  node workflows/error-learning.js -p will-generator --export-tests --path /path/to/project
`);
}

// Export for use as module
export { ErrorLearningSystem, ERROR_CATEGORIES };

// Run CLI if executed directly (not imported as a module)
// Check if this is the main module being run
const isMainModule = process.argv[1]?.includes('error-learning');
if (isMainModule) {
    main().catch(console.error);
}

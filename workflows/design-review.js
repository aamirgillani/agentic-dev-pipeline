#!/usr/bin/env node

/**
 * Multi-AI Design Review System
 *
 * Part of the Agentic Development Pipeline
 * Phase 2.5: UI/UX Design & Multi-AI Review
 *
 * Captures screenshots of UI components and generates prompts for
 * design review by ChatGPT, Gemini, and Claude.
 *
 * Usage: node workflows/design-review.js [feature-name] [mockup-path] [--config=project-name]
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const OUTPUT_DIR = join(__dirname, '../docs/design');
const SCREENSHOT_DIR = join(OUTPUT_DIR, 'screenshots');
const PROMPT_DIR = join(OUTPUT_DIR, 'prompts');
const REPORT_DIR = join(OUTPUT_DIR, 'reports');
const CONFIG_DIR = join(__dirname, '../config');

// Ensure directories exist
[OUTPUT_DIR, SCREENSHOT_DIR, PROMPT_DIR, REPORT_DIR].forEach(dir => {
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
});

/**
 * Load design system configuration
 */
function loadDesignSystem(configName = 'copper-teal-v3') {
    const configPath = join(CONFIG_DIR, 'design-systems', `${configName}.json`);
    if (existsSync(configPath)) {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
    console.warn(`Design system config not found: ${configPath}`);
    return null;
}

/**
 * Load project context configuration
 */
function loadProjectContext(projectName) {
    const configPath = join(CONFIG_DIR, 'project-context', `${projectName}.json`);
    if (existsSync(configPath)) {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
    }
    return null;
}

/**
 * Format design system for prompt embedding
 */
function formatDesignSystemForPrompt(designSystem) {
    if (!designSystem) return 'No design system configuration loaded.';

    const colors = Object.entries(designSystem.colors || {})
        .map(([key, val]) => `| ${val.name} | \`${val.hex}\` | ${val.usage} |`)
        .join('\n');

    const typography = Object.entries(designSystem.typography?.scale || {})
        .map(([key, val]) => `| ${key} | ${val.size} | ${val.weight} |`)
        .join('\n');

    return `
## Design System: ${designSystem.name} v${designSystem.version}

### Mental Model
${designSystem.mental_model?.copper || 'N/A'}
${designSystem.mental_model?.teal || 'N/A'}

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
${colors}

### Typography
| Element | Size | Weight |
|---------|------|--------|
${typography}

### Spacing
- Grid Unit: ${designSystem.spacing?.grid_unit || '4px'}
- Values: ${designSystem.spacing?.scale ? Object.values(designSystem.spacing.scale).join(', ') : 'N/A'}

### Components
- Border Radius (inputs): ${designSystem.components?.border_radius?.inputs || '8px'}
- Border Radius (cards): ${designSystem.components?.border_radius?.cards || '16px'}
- Shadow Max Opacity: ${designSystem.components?.shadows?.max_opacity || '10%'}
- Hit Target Min: ${designSystem.components?.hit_targets?.minimum || '44px'}
`;
}

/**
 * Scoring criteria for design review
 */
const SCORING_CRITERIA = [
    {
        name: 'Design System Compliance',
        weight: 20,
        checks: [
            'Colors match specification exactly',
            'Typography follows hierarchy',
            'Spacing uses defined grid',
            'Components use correct border-radius'
        ]
    },
    {
        name: 'Visual Hierarchy',
        weight: 15,
        checks: [
            'One clear primary action per screen',
            'Headings distinguishable from body',
            'Important information prominent',
            'Logical reading flow'
        ]
    },
    {
        name: 'Accessibility',
        weight: 20,
        checks: [
            'Text contrast ≥ 4.5:1 (WCAG AA)',
            'Focus states visible',
            'Labels present for all inputs',
            'No color-only indicators',
            'Hit targets ≥ 44x44px'
        ]
    },
    {
        name: 'Consistency',
        weight: 15,
        checks: [
            'Similar elements styled identically',
            'Spacing uniform throughout',
            'Terminology consistent',
            'Patterns predictable'
        ]
    },
    {
        name: 'User Feedback States',
        weight: 15,
        checks: [
            'Loading states present',
            'Error states clear',
            'Success confirmation visible',
            'Empty states helpful'
        ]
    },
    {
        name: 'Responsive Design',
        weight: 15,
        checks: [
            'Works on mobile (375px)',
            'Works on tablet (768px)',
            'Works on desktop (1200px+)',
            'No horizontal scroll'
        ]
    }
];

/**
 * Generate the design review prompt for a specific AI
 */
function generatePrompt(featureName, screenshots, targetAI, designSystem, projectContext) {
    const screenshotList = screenshots.map((s, i) =>
        `${i + 1}. \`${s.name}\` - ${s.description}`
    ).join('\n');

    const criteriaList = SCORING_CRITERIA.map(c =>
        `### ${c.name} (${c.weight}%)\n${c.checks.map(ch => `- [ ] ${ch}`).join('\n')}`
    ).join('\n\n');

    const designSystemSpec = formatDesignSystemForPrompt(designSystem);

    const appContext = projectContext ? `
- Application: ${projectContext.description || 'N/A'}
- Target Users: ${projectContext.target_users?.primary || 'N/A'}
- Age Range: ${projectContext.target_users?.age_range || 'N/A'}
- Session Duration: ${projectContext.target_users?.session_duration || 'N/A'}
` : '';

    return `
# UI/UX Design Review Request

## Feature: ${featureName}
${appContext}

---

## Your Role

You are a Senior UI/UX Design Consultant reviewing a new feature for a professional B2B software application. Provide brutally honest, specific, actionable feedback.

**Evaluation approach:**
- Score each criterion on a scale of 1-10
- Cite specific issues with exact details (e.g., "Button uses #ABC instead of #B87333")
- Prioritize by severity: Critical (blocks release) > Major > Minor
- Provide concrete fixes, not vague suggestions

---

## Screenshots to Review

${screenshotList}

---

## Design System Specification

${designSystemSpec}

---

## Scoring Criteria

${criteriaList}

---

## Required Response Format

\`\`\`json
{
  "feature": "${featureName}",
  "reviewer": "${targetAI}",
  "overall_score": 85,
  "scores": {
    "design_system_compliance": {
      "score": 9,
      "pass": ["Colors correct", "Typography correct"],
      "fail": ["Button border-radius is 4px, should be 8px"],
      "fixes": ["Change .btn border-radius from 4px to 8px"]
    },
    "visual_hierarchy": {
      "score": 8,
      "pass": ["Clear primary action"],
      "fail": ["Section heading same weight as body"],
      "fixes": ["Increase section heading font-weight to 600"]
    },
    "accessibility": {
      "score": 7,
      "pass": ["Good text contrast"],
      "fail": ["Focus ring not visible", "Error shown only with color"],
      "fixes": ["Add 3px copper focus ring", "Add error icon + text"]
    },
    "consistency": {
      "score": 9,
      "pass": ["Uniform button styles"],
      "fail": [],
      "fixes": []
    },
    "user_feedback_states": {
      "score": 6,
      "pass": ["Error state present"],
      "fail": ["No loading state", "No empty state"],
      "fixes": ["Add spinner during save", "Add empty state message"]
    },
    "responsive_design": {
      "score": 8,
      "pass": ["Works on desktop"],
      "fail": ["Form stacks poorly on mobile"],
      "fixes": ["Use single column layout below 768px"]
    }
  },
  "critical_issues": [
    "Focus ring invisible - fails WCAG 2.1"
  ],
  "quick_wins": [
    "Add border-radius: 8px to buttons"
  ],
  "recommendation": "PASS | PASS_WITH_CHANGES | BLOCKED",
  "summary": "Overall assessment..."
}
\`\`\`

---

Please review the attached screenshots and provide your detailed assessment.
`;
}

/**
 * Capture screenshots for design review
 */
async function captureScreenshots(featureName, mockupPath) {
    const browser = await chromium.launch();
    const screenshots = [];

    const featureScreenshotDir = join(SCREENSHOT_DIR, featureName);
    if (!existsSync(featureScreenshotDir)) {
        mkdirSync(featureScreenshotDir, { recursive: true });
    }

    try {
        const page = await browser.newPage();

        if (mockupPath && existsSync(mockupPath)) {
            await page.goto(`file://${mockupPath}`);
        } else {
            throw new Error(`Mockup file not found: ${mockupPath}`);
        }

        await page.waitForTimeout(1000);

        // Desktop full page
        await page.setViewportSize({ width: 1440, height: 900 });
        const desktopPath = join(featureScreenshotDir, `${featureName}-desktop-full.png`);
        await page.screenshot({ path: desktopPath, fullPage: true });
        screenshots.push({ name: `${featureName}-desktop-full.png`, description: 'Full page on desktop (1440px)' });

        // Desktop viewport
        const desktopViewportPath = join(featureScreenshotDir, `${featureName}-desktop-viewport.png`);
        await page.screenshot({ path: desktopViewportPath, fullPage: false });
        screenshots.push({ name: `${featureName}-desktop-viewport.png`, description: 'Above-the-fold on desktop' });

        // Tablet
        await page.setViewportSize({ width: 768, height: 1024 });
        const tabletPath = join(featureScreenshotDir, `${featureName}-tablet.png`);
        await page.screenshot({ path: tabletPath, fullPage: true });
        screenshots.push({ name: `${featureName}-tablet.png`, description: 'Full page on tablet (768px)' });

        // Mobile
        await page.setViewportSize({ width: 375, height: 812 });
        const mobilePath = join(featureScreenshotDir, `${featureName}-mobile.png`);
        await page.screenshot({ path: mobilePath, fullPage: true });
        screenshots.push({ name: `${featureName}-mobile.png`, description: 'Full page on mobile (375px)' });

        // Component close-ups
        await page.setViewportSize({ width: 1440, height: 900 });

        const formSection = page.locator('form, .form-section, .form-group').first();
        if (await formSection.isVisible().catch(() => false)) {
            const formPath = join(featureScreenshotDir, `${featureName}-form-section.png`);
            await formSection.screenshot({ path: formPath });
            screenshots.push({ name: `${featureName}-form-section.png`, description: 'Form section close-up' });
        }

        const primaryButton = page.locator('.btn--primary, button[type="submit"], .primary-btn').first();
        if (await primaryButton.isVisible().catch(() => false)) {
            const btnPath = join(featureScreenshotDir, `${featureName}-primary-button.png`);
            await primaryButton.screenshot({ path: btnPath });
            screenshots.push({ name: `${featureName}-primary-button.png`, description: 'Primary action button' });
        }

        const sidebar = page.locator('.sidebar, nav, .navigation').first();
        if (await sidebar.isVisible().catch(() => false)) {
            const sidebarPath = join(featureScreenshotDir, `${featureName}-navigation.png`);
            await sidebar.screenshot({ path: sidebarPath });
            screenshots.push({ name: `${featureName}-navigation.png`, description: 'Navigation/sidebar' });
        }

        console.log(`✓ Captured ${screenshots.length} screenshots`);

    } finally {
        await browser.close();
    }

    return screenshots;
}

/**
 * Generate prompts for all AI models
 */
function generateAllPrompts(featureName, screenshots, designSystem, projectContext) {
    const models = ['ChatGPT', 'Gemini', 'Claude'];
    const prompts = {};

    const featurePromptDir = join(PROMPT_DIR, featureName);
    if (!existsSync(featurePromptDir)) {
        mkdirSync(featurePromptDir, { recursive: true });
    }

    models.forEach(model => {
        const prompt = generatePrompt(featureName, screenshots, model, designSystem, projectContext);
        const filename = `${featureName}-${model.toLowerCase()}-prompt.md`;
        const filepath = join(featurePromptDir, filename);

        writeFileSync(filepath, prompt);
        prompts[model] = filepath;
        console.log(`✓ Generated prompt for ${model}: ${filename}`);
    });

    // Combined prompt
    const combinedPath = join(featurePromptDir, `${featureName}-combined-prompt.md`);
    writeFileSync(combinedPath, generatePrompt(featureName, screenshots, 'AI Reviewer', designSystem, projectContext));
    console.log(`✓ Generated combined prompt`);

    return prompts;
}

/**
 * Generate HTML report
 */
function generateReport(featureName, screenshots, prompts, designSystem) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Design Review: ${featureName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #FAF9F7; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #1A2F2F; }
        .section { background: white; padding: 24px; margin: 20px 0; border-radius: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
        .screenshots { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .screenshot { border: 1px solid #E5E2DE; border-radius: 8px; overflow: hidden; }
        .screenshot img { width: 100%; display: block; }
        .screenshot-label { padding: 12px; background: #f9f9f9; font-size: 14px; color: #6B6560; }
        .prompts { display: flex; gap: 12px; flex-wrap: wrap; }
        .prompt-link { display: inline-block; padding: 12px 24px; background: #B87333; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .prompt-link:hover { background: #9a5f2a; }
        .checklist { columns: 2; }
        .checklist li { margin: 8px 0; }
        code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-family: 'Source Code Pro', monospace; }
        .quality-gate { padding: 16px; border-radius: 8px; margin-top: 16px; }
        .gate-pass { background: #dcfce7; border: 1px solid #16A34A; }
        .gate-changes { background: #fef3c7; border: 1px solid #D97706; }
        .gate-blocked { background: #fee2e2; border: 1px solid #DC2626; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Design Review: ${featureName}</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Design System: ${designSystem?.name || 'Default'} v${designSystem?.version || '1.0'}</p>

        <div class="section">
            <h2>Screenshots for Review</h2>
            <div class="screenshots">
                ${screenshots.map(s => `
                    <div class="screenshot">
                        <img src="../screenshots/${featureName}/${s.name}" alt="${s.description}">
                        <div class="screenshot-label">${s.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>AI Review Prompts</h2>
            <p>Copy these prompts and attach screenshots to get design feedback:</p>
            <div class="prompts">
                ${Object.entries(prompts).map(([model]) => `
                    <a href="../prompts/${featureName}/${featureName}-${model.toLowerCase()}-prompt.md" class="prompt-link">${model} Prompt</a>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <h2>Quality Gates</h2>
            <div class="quality-gate gate-pass">
                <strong>PASS (≥85 average, 0 critical):</strong> Proceed to implementation
            </div>
            <div class="quality-gate gate-changes">
                <strong>PASS WITH CHANGES (70-84, 0 critical):</strong> Minor fixes required
            </div>
            <div class="quality-gate gate-blocked">
                <strong>BLOCKED (&lt;70 OR critical issues):</strong> Major revision needed
            </div>
        </div>

        <div class="section">
            <h2>Design System Checklist</h2>
            <ul class="checklist">
                ${designSystem ? `
                <li>Primary Action: <code>${designSystem.colors?.primary_action?.hex || '#B87333'}</code></li>
                <li>Navigation: <code>${designSystem.colors?.navigation?.hex || '#1A2F2F'}</code></li>
                <li>Body Text: ${designSystem.typography?.scale?.body?.size || '16px'}</li>
                <li>H1: ${designSystem.typography?.scale?.h1?.size || '28px'}</li>
                <li>Spacing Grid: ${designSystem.spacing?.grid_unit || '4px'}</li>
                <li>Border Radius (inputs): ${designSystem.components?.border_radius?.inputs || '8px'}</li>
                <li>Hit Targets: ≥ ${designSystem.components?.hit_targets?.minimum || '44px'}</li>
                ` : `
                <li>No design system loaded</li>
                `}
            </ul>
        </div>

        <div class="section">
            <h2>Workflow</h2>
            <ol>
                <li>Review screenshots above</li>
                <li>Open prompt for each AI (ChatGPT, Gemini, Claude)</li>
                <li>Paste prompt and attach screenshots</li>
                <li>Collect JSON responses</li>
                <li>Average scores across all 3 AIs</li>
                <li>Address any consensus issues (flagged by 2+ AIs)</li>
                <li>Iterate until score ≥ 85</li>
            </ol>
        </div>
    </div>
</body>
</html>
    `;

    const reportPath = join(REPORT_DIR, `${featureName}-design-review.html`);
    writeFileSync(reportPath, html);
    console.log(`✓ Generated report: ${reportPath}`);

    return reportPath;
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
    const result = {
        featureName: 'feature',
        mockupPath: null,
        configName: 'copper-teal-v3',
        projectName: null
    };

    args.forEach((arg, i) => {
        if (arg.startsWith('--config=')) {
            result.configName = arg.split('=')[1];
        } else if (arg.startsWith('--project=')) {
            result.projectName = arg.split('=')[1];
        } else if (i === 0) {
            result.featureName = arg;
        } else if (i === 1 && !arg.startsWith('--')) {
            result.mockupPath = arg;
        }
    });

    return result;
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    const { featureName, mockupPath, configName, projectName } = parseArgs(args);

    console.log('\n' + '═'.repeat(60));
    console.log('  AGENTIC DEVELOPMENT PIPELINE');
    console.log('  Phase 2.5: UI/UX Design & Multi-AI Review');
    console.log('═'.repeat(60));

    // Load configurations
    const designSystem = loadDesignSystem(configName);
    const projectContext = projectName ? loadProjectContext(projectName) : null;

    console.log(`\nFeature: ${featureName}`);
    console.log(`Mockup: ${mockupPath || 'not specified'}`);
    console.log(`Design System: ${designSystem?.name || 'default'}`);
    console.log(`Project: ${projectContext?.name || 'generic'}\n`);

    if (!mockupPath) {
        console.error('Error: Mockup path required');
        console.log('\nUsage: node workflows/design-review.js <feature-name> <mockup-path> [--config=design-system] [--project=project-name]');
        process.exit(1);
    }

    try {
        console.log('1. Capturing screenshots...');
        const screenshots = await captureScreenshots(featureName, mockupPath);

        console.log('\n2. Generating AI prompts...');
        const prompts = generateAllPrompts(featureName, screenshots, designSystem, projectContext);

        console.log('\n3. Generating review report...');
        const reportPath = generateReport(featureName, screenshots, prompts, designSystem);

        console.log('\n' + '═'.repeat(60));
        console.log('  DESIGN REVIEW READY');
        console.log('═'.repeat(60));
        console.log(`\nScreenshots: ${SCREENSHOT_DIR}/${featureName}/`);
        console.log(`Prompts: ${PROMPT_DIR}/${featureName}/`);
        console.log(`Report: ${reportPath}`);
        console.log(`\nNext steps:`);
        console.log('  1. Open the report HTML file');
        console.log('  2. Copy prompts to ChatGPT, Gemini, and Claude');
        console.log('  3. Attach screenshots to each AI');
        console.log('  4. Collect JSON responses');
        console.log('  5. Average scores (must be ≥ 85 to pass)');
        console.log('  6. Address consensus issues\n');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();

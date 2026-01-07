# Quick Start Guide

Get up and running with the Agentic Development Pipeline in 10 minutes.

## Prerequisites Check

Before starting, ensure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Claude Code installed
- [ ] VS Code (recommended)
- [ ] Git installed
- [ ] A project to work on (or create a new one)

## Step 1: Setup (5 minutes)

### Clone/Download the Pipeline

```bash
cd /Users/aamirgillani/Documents/GitHub
git clone <this-repo-url> agentic-dev-pipeline
cd agentic-dev-pipeline
```

Or if integrating into existing project:
```bash
cd your-existing-project
# Copy the ai/, workflows/, tests/ folders here
```

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npm run playwright:install
```

This downloads Chrome, Firefox, and Safari test browsers (~500MB).

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```bash
# Minimum required
BASE_URL=http://localhost:3000
NODE_ENV=development
```

## Step 2: Verify Setup (2 minutes)

### Run Example Tests

```bash
# Run Playwright example test
npm run test:e2e

# Run API example tests
npm run test:api
```

If these pass, you're ready!

### Check Agent Configurations

```bash
# List agent files
ls -la ai/agents/

# Should see:
# - requirements-agent.json
# - code-builder-agent.json
# - test-builder-agent.json
# - validation-agent.json
```

## Step 3: First Feature (3 minutes)

### Example: Add a Simple Feature

Let's say you want to add a "Contact Us" form to your app.

#### 1. Describe to Claude Code

Open Claude Code in VS Code and say:

```
I want to add a contact form with the following:
- Name field (required)
- Email field (required, validated)
- Message field (required, min 10 characters)
- Submit button
- Success message after submission
- Store submissions in database

Run the full agentic pipeline for this feature.
```

#### 2. What Happens Next

**Phase 1: Requirements Agent** (30-60 seconds)
- Claude Code loads `ai/prompts/requirements_and_tests.txt`
- Generates structured requirements
- Creates test scenarios
- Outputs to `docs/requirements/contact-form.md`
- **STOPS and waits for your approval** ⏸️

**Review the Requirements** (1-2 minutes)
- Open `docs/requirements/contact-form.md`
- Check if requirements match your intent
- Verify edge cases are covered
- Approve by saying: "Looks good, proceed"

**Phase 2: Code Builder Agent** (1-3 minutes)
- Claude Code loads `ai/prompts/code_builder.txt`
- Implements the contact form
- Creates:
  - Frontend component
  - API endpoint
  - Database model/migration
  - Validation logic
  - Error handling

**Phase 3: Test Builder Agent** (1-2 minutes)
- Claude Code loads `ai/prompts/test_builder.txt`
- Creates:
  - Playwright test (fills form, submits, checks UI)
  - API test (validates endpoint)
  - Database test (checks data is saved)

**Phase 4: Validation Agent** (30-60 seconds)
- Claude Code loads `ai/prompts/validation_agent.txt`
- Runs all tests in real browsers
- Validates security
- Checks performance
- Generates report in `docs/validation/contact-form-report.md`
- **STOPS and waits for your review** ⏸️

**Review the Validation Report** (1-2 minutes)
- Open `docs/validation/contact-form-report.md`
- See what passed/failed
- Review any auto-fixes applied
- Decide: Deploy, fix issues, or iterate

#### 3. Deploy or Iterate

If all tests pass:
```bash
git add .
git commit -m "Add contact form feature"
git push
```

If tests fail, review the failure analysis and either:
- Let the agent auto-fix (if suggested)
- Make manual changes
- Clarify requirements and re-run

## Understanding the Workflow

### The Agent Handoff

```
You → Requirements Agent → [Approval] → Code Builder → Test Builder → Validation → [Review] → You
```

### What Each Agent Does

| Agent | Input | Output | Duration |
|-------|-------|--------|----------|
| Requirements | Plain English | Structured docs | 30-60s |
| Code Builder | Requirements | Implementation | 1-3m |
| Test Builder | Code + Scenarios | Test suite | 1-2m |
| Validation | Tests + Code | Report | 30-60s |

### Where to Find Outputs

- **Requirements**: `docs/requirements/[feature].md`
- **Implementation**: Your source code files
- **Tests**: `tests/playwright/`, `tests/api/`, `tests/database/`
- **Validation Reports**: `docs/validation/[feature]-report.md`

## Common Use Cases

### Use Case 1: New Feature

```
"Add user authentication with email/password"
"Run the full agentic pipeline for this feature"
```

### Use Case 2: Bug Fix

```
"Fix the bug where users can submit empty forms"
"Run the validation pipeline to test the fix"
```

### Use Case 3: Refactoring

```
"Refactor the user service to use async/await instead of callbacks"
"Run the full pipeline to ensure no regressions"
```

### Use Case 4: Just Requirements

```
"Analyze requirements for a payment integration feature"
"Use the requirements agent only, don't implement yet"
```

### Use Case 5: Just Testing

```
"Create comprehensive tests for the existing checkout flow"
"Use the test builder and validation agents"
```

## Tips for Success

### 1. Be Specific in Feature Descriptions

❌ Bad: "Add a form"
✅ Good: "Add a contact form with name, email, message fields. Validate email format. Store in database. Show success message."

### 2. Review Requirements Carefully

The Requirements Agent checkpoint is your chance to catch issues early.
- Are edge cases identified?
- Are assumptions correct?
- Is anything missing?

### 3. Trust the Validation Report

If the Validation Agent says tests pass, they actually passed in real browsers.
- Screenshots prove it
- Network logs prove it
- Database state proves it

### 4. Use Human Checkpoints

The two checkpoints exist for a reason:
- **Checkpoint 1**: Ensure you're building the right thing
- **Checkpoint 2**: Ensure it actually works before deploying

### 5. Iterate Based on Feedback

If tests fail:
1. Read the root cause analysis
2. Decide if it's a code issue or requirements issue
3. Either auto-fix or clarify requirements
4. Re-run validation

## Advanced Tips

### Running Agents Individually

```bash
# Just generate requirements
npm run workflow:requirements

# Just validate existing code
npm run workflow:validate
```

### Customizing Agent Behavior

Edit the system prompts in `ai/prompts/` to:
- Add company coding standards
- Change test coverage thresholds
- Adjust security requirements
- Add custom validation rules

### Debugging Failed Tests

```bash
# Run Playwright in UI mode to see what's happening
npm run test:e2e:ui

# Run in headed mode to watch the browser
npm run test:e2e:headed

# Debug a specific test
npx playwright test --debug tests/playwright/contact-form.spec.js
```

### Viewing Test Reports

```bash
# View Playwright HTML report
npm run test:report

# View in browser
open test-results/playwright-report/index.html
```

## Troubleshooting

### "Cannot find module" Error

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Playwright Tests Timeout

Check your `BASE_URL` in `.env`:
```bash
# Make sure your app is running on this URL
BASE_URL=http://localhost:3000
```

Or disable web server wait in `playwright.config.js`.

### Tests Pass But App Is Broken

This shouldn't happen with real browser tests, but if it does:
1. Check if tests are using mock data instead of real data
2. Verify tests are hitting the actual API
3. Ensure database is being checked in tests

### Agent Not Following Prompts

1. Verify prompt file exists: `ls ai/prompts/`
2. Check prompt file is readable
3. Ensure Claude Code has file access
4. Try reloading VS Code

## Next Steps

Now that you're set up:

1. **Try the Example**: Run through the contact form example above
2. **Build a Real Feature**: Use the pipeline for an actual feature
3. **Customize**: Edit prompts to match your coding style
4. **Integrate**: Add to your CI/CD pipeline
5. **Scale**: Build multiple features using the same process

## Getting Help

- Check the main [README.md](../README.md) for detailed explanations
- Review agent prompts to understand their behavior
- Look at example tests for patterns
- Review validation reports for insights

## You're Ready!

You now have:
- ✅ A working pipeline
- ✅ Four specialized agents
- ✅ Real browser testing
- ✅ Human checkpoints
- ✅ Automated validation

**Time to build something amazing.** 🚀

# Autonomous Agentic Development Pipeline

A fully autonomous development environment where you describe features in plain English, and AI agents handle requirements, code generation, testing, and validation.

## What This Is

This is a **repeatable, autonomous development pipeline** that transforms plain-English feature descriptions into production-ready code with comprehensive testing.

### The Flow

```
You (Plain English Feature Description)
        ↓
📋 Requirements Agent
    Generates: Requirements + Test Scenarios
        ↓ [Human Review Checkpoint]
⚙️  Code Builder Agent
    Generates: Implementation
        ↓
🧪 Test Builder Agent
    Generates: Automated Tests (Playwright + API + Database)
        ↓
✅ Validation Agent
    Runs: Real Browser Tests + Validation
        ↓ [Human Review Checkpoint]
🚀 Deployment Decision
```

## Core Principles

### 1️⃣ Structured Intent Before Code
No coding happens until requirements and tests exist.

### 2️⃣ Sub-Agents With Clear Roles
Each agent has one responsibility and stays in its lane.

### 3️⃣ Automation With Human Checkpoints
You stay in control, but don't do manual labor.

### 4️⃣ Real Testing, Not "AI Says It Passed"
Tests run in actual browsers, against real APIs, with real data.

## Quick Start

### Prerequisites

- Node.js 18+ or Python 3.9+
- Claude Code (Anthropic)
- VS Code (recommended)
- Git

### Installation

```bash
# Clone or create your project with this pipeline
cd your-project

# Install dependencies
npm install

# Install Playwright browsers
npm run playwright:install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

### First Use

1. **Describe your feature** to Claude Code in plain English:
   ```
   "I want to add user profile editing with avatar upload"
   ```

2. **Trigger the pipeline**:
   ```
   "Run the full agentic pipeline for this feature"
   ```

3. **Review requirements** when the Requirements Agent completes
   - Check requirements document in `docs/requirements/`
   - Approve or request changes

4. **Wait for implementation** - Code Builder Agent executes

5. **Wait for tests** - Test Builder Agent creates test suite

6. **Review validation report** when Validation Agent completes
   - See what passed/failed
   - Review auto-fixes applied
   - Decide on deployment

## The Four Agents

### 📋 Requirements & Test Design Agent

**Purpose**: Convert plain English → structured requirements

**Inputs**: Your feature description

**Outputs**:
- Structured requirements document
- User stories
- Acceptance criteria
- Test scenarios (happy path + edge cases)
- Data model changes
- API specifications

**Location**: [ai/prompts/requirements_and_tests.txt](ai/prompts/requirements_and_tests.txt)

**Configuration**: [ai/agents/requirements-agent.json](ai/agents/requirements-agent.json)

**Checkpoint**: ⏸️ Human approval required before proceeding

### ⚙️ Code Builder Agent

**Purpose**: Implement only what was approved (no scope creep)

**Inputs**:
- Approved requirements
- Test scenarios

**Outputs**:
- Backend implementation
- Frontend components
- Database migrations
- API endpoints
- Error handling

**Location**: [ai/prompts/code_builder.txt](ai/prompts/code_builder.txt)

**Configuration**: [ai/agents/code-builder-agent.json](ai/agents/code-builder-agent.json)

**Rules**:
- Build exactly what's specified
- No creative interpretation
- Map code to requirements
- Follow security checklist

### 🧪 Test Builder Agent

**Purpose**: Turn scenarios into executable tests

**Inputs**:
- Test scenarios
- Implemented code
- Application structure

**Outputs**:
- Playwright E2E tests (real browser)
- API/Integration tests
- Database tests
- Cross-layer validation tests

**Location**: [ai/prompts/test_builder.txt](ai/prompts/test_builder.txt)

**Configuration**: [ai/agents/test-builder-agent.json](ai/agents/test-builder-agent.json)

**Test Types**:
- ✅ UI tests (Playwright)
- ✅ API tests (Vitest/Jest)
- ✅ Database tests
- ✅ End-to-end journeys (UI → API → DB → UI)

### ✅ Execution & Validation Agent

**Purpose**: Prove the system actually works

**Inputs**:
- Codebase
- Test suite
- Requirements document

**Outputs**:
- Test execution report
- Failure analysis with root causes
- Automated fixes (when safe)
- Security validation
- Performance metrics
- Deployment recommendation

**Location**: [ai/prompts/validation_agent.txt](ai/prompts/validation_agent.txt)

**Configuration**: [ai/agents/validation-agent.json](ai/agents/validation-agent.json)

**Checkpoint**: ⏸️ Human review before deployment

## Project Structure

```
agentic-dev-pipeline/
├── ai/
│   ├── agents/              # Agent configurations (JSON)
│   │   ├── requirements-agent.json
│   │   ├── code-builder-agent.json
│   │   ├── test-builder-agent.json
│   │   └── validation-agent.json
│   └── prompts/             # System prompts for each agent
│       ├── requirements_and_tests.txt
│       ├── code_builder.txt
│       ├── test_builder.txt
│       └── validation_agent.txt
├── workflows/               # Pipeline orchestration
│   └── run-full-pipeline.js
├── tests/
│   ├── playwright/          # E2E browser tests
│   ├── api/                 # API integration tests
│   ├── database/            # Database tests
│   ├── fixtures/            # Test data
│   └── setup.js             # Test configuration
├── docs/
│   ├── requirements/        # Generated requirements docs
│   ├── implementation/      # Implementation notes
│   └── validation/          # Validation reports
├── config/                  # Application config
├── playwright.config.js     # Playwright configuration
├── vitest.config.js         # Vitest configuration
├── package.json
└── README.md
```

## Running Tests

### All Tests
```bash
npm test
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (visual)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View last report
npm run test:report
```

### API Tests
```bash
npm run test:api
```

### Unit Tests
```bash
npm run test:unit
```

## Human Checkpoints

### Checkpoint 1: Requirements Approval
**When**: After Requirements Agent completes

**What to Review**:
- Are requirements accurate?
- Are edge cases covered?
- Are assumptions acceptable?
- Is scope correct?

**Location**: `docs/requirements/[feature-name].md`

**Action**: Approve or request changes

### Checkpoint 2: Validation Review
**When**: After Validation Agent completes

**What to Review**:
- Test results (passed/failed)
- Auto-fixes applied
- Escalated issues
- Security validation
- Performance metrics

**Location**: `docs/validation/[feature-name]-report.md`

**Action**: Deploy, fix issues, or iterate

## Why This Setup Works

### For Solo Founders
- **Leverage**: Build 10x faster without coding everything yourself
- **Confidence**: Comprehensive testing catches issues before production
- **Control**: Human checkpoints keep you in charge

### For Developers
- **Focus**: Think about what to build, not how
- **Quality**: Automated testing maintains high standards
- **Documentation**: Requirements and tests serve as living docs

### For Teams
- **Consistency**: Same process every time
- **Onboarding**: New team members can see how features are built
- **Knowledge Transfer**: Everything is documented automatically

## Testing Philosophy

### Real Testing, Not Simulations

This pipeline uses **Playwright** to run tests in actual browsers:
- Real Chrome, Firefox, Safari
- Real button clicks
- Real form submissions
- Real network requests
- Real database operations

### Cross-Layer Validation

Tests verify complete user journeys:
```
User clicks "Add to Cart"
    ↓
POST /api/cart
    ↓
cart_items table updated
    ↓
UI shows item count badge
```

This is the **gold standard** - testing the entire stack.

### Evidence-Based Validation

Every test produces evidence:
- Screenshots on failure
- Network logs
- Console logs
- Performance traces
- Database state snapshots

## Security

The Code Builder Agent follows a security checklist:
- ✅ Input validation on all user inputs
- ✅ Parameterized queries (no SQL injection)
- ✅ XSS prevention
- ✅ Authentication on protected routes
- ✅ Authorization checks
- ✅ No hardcoded secrets
- ✅ Proper error handling without exposing internals

## Customization

### Modifying Agent Behavior

Edit the system prompts in `ai/prompts/`:
- Add company-specific coding standards
- Change test coverage requirements
- Adjust security requirements
- Add custom validation rules

### Changing Agent Configurations

Edit JSON files in `ai/agents/`:
- Adjust agent capabilities
- Change output formats
- Modify handoff procedures
- Add custom checkpoints

### Adding New Agents

1. Create system prompt in `ai/prompts/`
2. Create configuration in `ai/agents/`
3. Update workflow orchestration
4. Test in isolation before integrating

## Advanced Usage

### Running Individual Agents

```bash
# Just requirements
npm run workflow:requirements

# Just code building
npm run workflow:build

# Just test creation
npm run workflow:test

# Just validation
npm run workflow:validate
```

### Integration with CI/CD

The pipeline can be integrated with GitHub Actions, GitLab CI, etc.:

```yaml
# .github/workflows/agentic-pipeline.yml
name: Agentic Pipeline
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run playwright:install
      - run: npm test
```

## MCP Integration

This pipeline is designed to work with **Model Context Protocol (MCP)** for advanced capabilities:

- Execute Playwright tests programmatically
- Observe browser state during test runs
- Capture screenshots and logs automatically
- React to test failures in real-time
- Make intelligent decisions about fixes

## Troubleshooting

### Tests Failing on Setup

1. Check environment variables: `cp .env.example .env`
2. Install Playwright browsers: `npm run playwright:install`
3. Check database is running
4. Verify dependencies: `npm install`

### Agent Not Following Prompts

1. Check system prompt file exists and is readable
2. Verify agent configuration JSON is valid
3. Ensure Claude Code can access the files
4. Check for typos in file paths

### Performance Issues

1. Run tests in parallel: Set `PARALLEL_TESTS=true` in `.env`
2. Use headless mode: Set `PLAYWRIGHT_HEADED=false`
3. Reduce test retries in CI environments
4. Consider running heavy tests only in CI

## Next Steps

Once you have this pipeline working:

1. **Add Your App**: Integrate with your existing codebase
2. **Customize Prompts**: Tailor agents to your stack and style
3. **Build Features**: Start using the pipeline for real work
4. **Iterate**: Refine based on what works for you
5. **Scale**: Add more agents for specific needs (API docs, migrations, etc.)

## Philosophy

This system embodies a new way of building software:

> **You think in systems and outcomes.**
> **Agents handle implementation details.**
> **Tests prove it actually works.**
> **You stay in control with strategic checkpoints.**

This is how next-generation solo founders and small teams will operate.

## License

MIT

## Support

For issues, questions, or contributions, see the project repository.

---

**Built for the autonomous builder who values leverage, quality, and control.**

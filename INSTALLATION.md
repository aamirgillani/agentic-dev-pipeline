# Installation Instructions

## Quick Installation

```bash
cd /Users/aamirgillani/Documents/GitHub/agentic-dev-pipeline

# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npm run playwright:install

# 3. Set up environment
cp .env.example .env

# 4. Verify setup
npm run test:e2e
npm run test:api
```

## What Gets Installed

### Node Packages
- `@playwright/test` - Real browser testing
- `vitest` - Fast unit/API testing  
- `supertest` - HTTP testing
- `dotenv` - Environment configuration

### Playwright Browsers (~500MB)
- Chromium
- Firefox
- WebKit (Safari)

## System Requirements

- Node.js 18 or higher
- ~1GB free disk space (for browsers)
- macOS, Linux, or Windows

## Verification

After installation, you should see:

```bash
✓ Dependencies installed
✓ Playwright browsers downloaded
✓ Example tests pass
```

## Troubleshooting

### "Command not found: npm"
Install Node.js from https://nodejs.org

### "Playwright install failed"
Run manually: `npx playwright install`

### "Tests timeout"
Check .env - ensure BASE_URL is correct

## Next Steps

See [QUICK_START.md](docs/QUICK_START.md) for your first feature.

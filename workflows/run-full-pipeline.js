#!/usr/bin/env node

/**
 * Full Agentic Development Pipeline
 *
 * This orchestrates all agents in sequence:
 * 1. Requirements Agent → generates requirements and test scenarios
 * 2. Human Checkpoint → user approves requirements
 * 3. Code Builder Agent → implements the approved requirements
 * 4. Test Builder Agent → creates automated tests
 * 5. Validation Agent → runs tests and validates
 * 6. Human Checkpoint → user reviews validation report
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load agent configurations
function loadAgentConfig(agentName) {
  const configPath = join(__dirname, '..', 'ai', 'agents', `${agentName}.json`);
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

// Load system prompt
function loadSystemPrompt(promptFile) {
  const promptPath = join(__dirname, '..', 'ai', promptFile);
  return readFileSync(promptPath, 'utf-8');
}

// Agent configurations
const agents = {
  requirements: loadAgentConfig('requirements-agent'),
  codeBuilder: loadAgentConfig('code-builder-agent'),
  testBuilder: loadAgentConfig('test-builder-agent'),
  validation: loadAgentConfig('validation-agent'),
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        Autonomous Agentic Development Pipeline                ║
║                                                                ║
║  Requirements → Code → Tests → Validation                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

console.log('This pipeline will guide you through the full development workflow:\n');
console.log('📋 Phase 1: Requirements & Test Design');
console.log('   ↓ [Human Review Checkpoint]');
console.log('⚙️  Phase 2: Code Implementation');
console.log('   ↓');
console.log('🧪 Phase 3: Test Creation');
console.log('   ↓');
console.log('✅ Phase 4: Validation & Testing');
console.log('   ↓ [Human Review Checkpoint]');
console.log('🚀 Phase 5: Deployment Decision\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('To use this pipeline with Claude Code:\n');
console.log('1. Describe your feature in plain English to Claude Code');
console.log('2. Say: "Run the full agentic pipeline for this feature"\n');
console.log('Claude Code will then:\n');

console.log('📋 PHASE 1: Requirements Agent');
console.log('   - Load system prompt from:', agents.requirements.systemPromptFile);
console.log('   - Generate structured requirements');
console.log('   - Identify test scenarios and edge cases');
console.log('   - Output to: docs/requirements/');
console.log('   - WAIT for your approval ⏸️\n');

console.log('⚙️  PHASE 2: Code Builder Agent (after approval)');
console.log('   - Load system prompt from:', agents.codeBuilder.systemPromptFile);
console.log('   - Implement only approved requirements');
console.log('   - Follow security checklist');
console.log('   - No scope creep allowed');
console.log('   - Map every file to requirements\n');

console.log('🧪 PHASE 3: Test Builder Agent');
console.log('   - Load system prompt from:', agents.testBuilder.systemPromptFile);
console.log('   - Create Playwright E2E tests');
console.log('   - Create API/backend tests');
console.log('   - Create database tests');
console.log('   - Ensure cross-layer validation\n');

console.log('✅ PHASE 4: Validation Agent');
console.log('   - Load system prompt from:', agents.validation.systemPromptFile);
console.log('   - Run all tests in real browsers');
console.log('   - Analyze failures with root cause');
console.log('   - Auto-fix simple issues');
console.log('   - Generate comprehensive report');
console.log('   - WAIT for your deployment decision ⏸️\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Example Usage:\n');
console.log('You: "I want to add user profile editing to my app"\n');
console.log('You: "Run the full agentic pipeline for this feature"\n');
console.log('Claude: [Loads requirements agent prompt and begins analysis...]\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Agent Configurations Loaded:');
console.log('  ✅ Requirements Agent:', agents.requirements.name);
console.log('  ✅ Code Builder Agent:', agents.codeBuilder.name);
console.log('  ✅ Test Builder Agent:', agents.testBuilder.name);
console.log('  ✅ Validation Agent:', agents.validation.name);

console.log('\n📝 Ready to process your feature description!\n');

// Export configurations for use by Claude Code
export { agents, loadSystemPrompt };

#!/usr/bin/env node

/**
 * Full Agentic Development Pipeline
 *
 * This orchestrates all agents in sequence:
 * 1. Requirements Agent → generates requirements and test scenarios
 * 2. Human Checkpoint → user approves requirements
 * 3. Design Agent → creates mockups and multi-AI design review
 * 4. Human Checkpoint → user approves design
 * 5. Code Builder Agent → implements the approved requirements
 * 6. Test Builder Agent → creates automated tests
 * 7. Validation Agent → runs tests and validates
 * 8. Human Checkpoint → user reviews validation report
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
  design: loadAgentConfig('design-agent'),
  codeBuilder: loadAgentConfig('code-builder-agent'),
  testBuilder: loadAgentConfig('test-builder-agent'),
  validation: loadAgentConfig('validation-agent'),
};

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║        Autonomous Agentic Development Pipeline v2.0           ║
║                                                                ║
║  Requirements → Design → Code → Tests → Validation            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);

console.log('This pipeline will guide you through the full development workflow:\n');
console.log('📋 Phase 1: Requirements & Test Design');
console.log('   ↓ [Human Review Checkpoint]');
console.log('🎨 Phase 2: UI/UX Design & Multi-AI Review');
console.log('   ↓ [Human Review Checkpoint]');
console.log('⚙️  Phase 3: Code Implementation');
console.log('   ↓');
console.log('🧪 Phase 4: Test Creation');
console.log('   ↓');
console.log('✅ Phase 5: Validation & Testing');
console.log('   ↓ [Human Review Checkpoint]');
console.log('🚀 Phase 6: Deployment Decision\n');

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

console.log('🎨 PHASE 2: Design Agent (after requirements approval)');
console.log('   - Load system prompt from:', agents.design.systemPromptFile);
console.log('   - Create UI mockups following design system');
console.log('   - Capture screenshots at desktop/tablet/mobile');
console.log('   - Generate prompts for ChatGPT, Gemini, Claude');
console.log('   - Collect and aggregate multi-AI feedback');
console.log('   - Quality gate: average score ≥ 85 to pass');
console.log('   - Output to: docs/design/');
console.log('   - WAIT for your approval ⏸️\n');

console.log('⚙️  PHASE 3: Code Builder Agent (after design approval)');
console.log('   - Load system prompt from:', agents.codeBuilder.systemPromptFile);
console.log('   - Implement ONLY approved mockups exactly');
console.log('   - Follow security checklist');
console.log('   - No scope creep allowed');
console.log('   - Map every file to requirements\n');

console.log('🧪 PHASE 4: Test Builder Agent');
console.log('   - Load system prompt from:', agents.testBuilder.systemPromptFile);
console.log('   - Create Playwright E2E tests');
console.log('   - Create API/backend tests');
console.log('   - Create database tests');
console.log('   - Ensure cross-layer validation\n');

console.log('✅ PHASE 5: Validation Agent');
console.log('   - Load system prompt from:', agents.validation.systemPromptFile);
console.log('   - Run all tests in real browsers');
console.log('   - Analyze failures with root cause');
console.log('   - Auto-fix simple issues');
console.log('   - Generate comprehensive report');
console.log('   - WAIT for your deployment decision ⏸️\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Design Review Tool:\n');
console.log('  node workflows/design-review.js <feature> <mockup.html> [--config=design-system] [--project=project-name]\n');
console.log('  Example: node workflows/design-review.js login-form ./mockups/login.html --config=copper-teal-v3\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Example Usage:\n');
console.log('You: "I want to add user profile editing to my app"\n');
console.log('You: "Run the full agentic pipeline for this feature"\n');
console.log('Claude: [Loads requirements agent prompt and begins analysis...]\n');

console.log('═══════════════════════════════════════════════════════════════\n');

console.log('Agent Configurations Loaded:');
console.log('  ✅ Requirements Agent:', agents.requirements.name);
console.log('  ✅ Design Agent:', agents.design.name);
console.log('  ✅ Code Builder Agent:', agents.codeBuilder.name);
console.log('  ✅ Test Builder Agent:', agents.testBuilder.name);
console.log('  ✅ Validation Agent:', agents.validation.name);

console.log('\n📝 Ready to process your feature description!\n');

// Export configurations for use by Claude Code
export { agents, loadSystemPrompt };

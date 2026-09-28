import { EmailCategory, EmailItem, CategoryMemoryRule } from '../types';

const STORAGE_KEY = 'mailguard_category_ai_memory_v1';

// Initial default learned rules representing established preferences
const DEFAULT_RULES: CategoryMemoryRule[] = [
  {
    id: 'rule-chase-official',
    targetPattern: 'fraud-alerts@chase.com',
    matchType: 'sender_email',
    assignedCategory: 'banking',
    originalCategory: 'general',
    createdAt: '2026-09-10T10:00:00Z',
    hitCount: 5
  },
  {
    id: 'rule-internal-corp',
    targetPattern: 'enterprise.corp',
    matchType: 'sender_domain',
    assignedCategory: 'companies',
    originalCategory: 'general',
    createdAt: '2026-09-11T12:00:00Z',
    hitCount: 12
  }
];

export function getCategoryMemoryRules(): CategoryMemoryRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RULES));
      return DEFAULT_RULES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_RULES;
  }
}

export function saveCategoryMemoryRule(rule: Omit<CategoryMemoryRule, 'id' | 'createdAt' | 'hitCount'>): CategoryMemoryRule {
  const current = getCategoryMemoryRules();
  // Check if existing rule for same pattern exists
  const existingIdx = current.findIndex(r => r.targetPattern.toLowerCase() === rule.targetPattern.toLowerCase());
  
  const newRule: CategoryMemoryRule = {
    ...rule,
    id: 'cat-rule-' + Date.now(),
    createdAt: new Date().toISOString(),
    hitCount: 1
  };

  let updated: CategoryMemoryRule[];
  if (existingIdx >= 0) {
    updated = current.map((r, idx) => idx === existingIdx ? { ...newRule, id: r.id, hitCount: r.hitCount + 1 } : r);
  } else {
    updated = [newRule, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to persist category memory rule', err);
  }

  return newRule;
}

export function removeCategoryMemoryRule(ruleId: string): void {
  const current = getCategoryMemoryRules();
  const updated = current.filter(r => r.id !== ruleId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove category rule', err);
  }
}

/**
 * Checks if an email matches any remembered AI categorization rules
 */
export function predictCategoryFromMemory(email: Pick<EmailItem, 'fromEmail'>): {
  predictedCategory: EmailCategory | null;
  matchingRule: CategoryMemoryRule | null;
} {
  const rules = getCategoryMemoryRules();
  const emailLower = (email.fromEmail || '').toLowerCase();
  const domain = emailLower.includes('@') ? emailLower.split('@')[1] : '';

  // Priority 1: Exact sender email match
  const exactRule = rules.find(r => r.matchType === 'sender_email' && r.targetPattern.toLowerCase() === emailLower);
  if (exactRule) {
    return { predictedCategory: exactRule.assignedCategory, matchingRule: exactRule };
  }

  // Priority 2: Domain match
  if (domain) {
    const domainRule = rules.find(r => r.matchType === 'sender_domain' && (
      r.targetPattern.toLowerCase() === domain || domain.endsWith('.' + r.targetPattern.toLowerCase())
    ));
    if (domainRule) {
      return { predictedCategory: domainRule.assignedCategory, matchingRule: domainRule };
    }
  }

  return { predictedCategory: null, matchingRule: null };
}

import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { reset } from '@poc/bus';

/**
 * This suite belongs to the legacy team and runs on :3002 only.
 *
 * Note there is nothing React-17-specific in here. TWD drives the real DOM, so
 * the same test API works against a class component on React 17 and a hooks
 * component on React 19 — which is what makes tests survive the migration.
 */
describe('Legacy React microfrontend', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    reset('test setup');
  });

  it('renders on React 17', async () => {
    const badge = await twd.get('.mfe-card--legacy .mfe-card__badge');
    badge.should('contain.text', 'react 17');
  });

  it('increments the shared counter', async () => {
    await screenDom.findByText('0', { selector: '[data-testid="legacy-count"]' });

    const plus = await twd.get('.mfe-card--legacy .mfe-card__button');
    await userEvent.click(plus.el);

    await screenDom.findByText('1', { selector: '[data-testid="legacy-count"]' });
  });

  it('renders the greeting from its own mocked endpoint', async () => {
    await twd.mockRequest('legacyGreeting', {
      method: 'GET',
      url: '/api/legacy/greeting',
      response: { message: 'hello from the legacy mock' },
    });

    const refresh = await twd.get('[data-testid="legacy-refresh"]');
    await userEvent.click(refresh.el);

    await twd.waitForRequest('legacyGreeting');
    await screenDom.findByText('hello from the legacy mock', {
      selector: '[data-testid="legacy-greeting"]',
    });
  });

  it('falls back when its API is unavailable', async () => {
    const refresh = await twd.get('[data-testid="legacy-refresh"]');
    await userEvent.click(refresh.el);

    await screenDom.findByText('api offline', {
      selector: '[data-testid="legacy-greeting"]',
    });
  });
});

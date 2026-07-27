import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { reset } from '@poc/bus';

/**
 * This suite belongs to the modern-React team and runs on :3001 only.
 *
 * It mocks /api/modern/* and nothing else. The legacy and Vue teams mock their
 * own endpoints in their own repos, against their own service worker, on their
 * own origin — no shared fixture file, no coordination.
 */
describe('Modern React microfrontend', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    // The test can drive the shared store directly, which is the cheapest way
    // to make the counter assertions deterministic.
    reset('test setup');
  });

  it('renders on React 19', async () => {
    const badge = await twd.get('.mfe-card--modern .mfe-card__badge');
    badge.should('contain.text', 'react 19');
  });

  it('increments the shared counter', async () => {
    await screenDom.findByText('0', { selector: '[data-testid="modern-count"]' });

    const plus = await twd.get('.mfe-card--modern .mfe-card__button');
    await userEvent.click(plus.el);

    // find* retries, so this can't race React's re-render.
    await screenDom.findByText('1', { selector: '[data-testid="modern-count"]' });
  });

  it('renders the greeting from its own mocked endpoint', async () => {
    await twd.mockRequest('modernGreeting', {
      method: 'GET',
      url: '/api/modern/greeting',
      response: { message: 'hello from the modern mock' },
    });

    const refresh = await twd.get('[data-testid="modern-refresh"]');
    await userEvent.click(refresh.el);

    await twd.waitForRequest('modernGreeting');
    await screenDom.findByText('hello from the modern mock', {
      selector: '[data-testid="modern-greeting"]',
    });
  });

  it('falls back when its API is unavailable', async () => {
    // No mock rule registered, so the request 404s against the dev server.
    const refresh = await twd.get('[data-testid="modern-refresh"]');
    await userEvent.click(refresh.el);

    await screenDom.findByText('api offline', {
      selector: '[data-testid="modern-greeting"]',
    });
  });
});

import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { reset } from '@poc/bus';

/**
 * This suite belongs to the Vue team and runs on :3003 only.
 *
 * Identical test API to the two React suites — TWD asserts against the DOM, so
 * it neither knows nor cares that this component is Vue.
 */
describe('Vue microfrontend', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    reset('test setup');
  });

  it('renders on Vue 3', async () => {
    const badge = await twd.get('.mfe-card--vue .mfe-card__badge');
    badge.should('contain.text', 'vue 3');
  });

  it('increments the shared counter', async () => {
    await screenDom.findByText('0', { selector: '[data-testid="vue-count"]' });

    const plus = await twd.get('.mfe-card--vue .mfe-card__button');
    await userEvent.click(plus.el);

    await screenDom.findByText('1', { selector: '[data-testid="vue-count"]' });
  });

  it('renders the greeting from its own mocked endpoint', async () => {
    await twd.mockRequest('vueGreeting', {
      method: 'GET',
      url: '/api/vue/greeting',
      response: { message: 'hello from the vue mock' },
    });

    const refresh = await twd.get('[data-testid="vue-refresh"]');
    await userEvent.click(refresh.el);

    await twd.waitForRequest('vueGreeting');
    await screenDom.findByText('hello from the vue mock', {
      selector: '[data-testid="vue-greeting"]',
    });
  });

  it('falls back when its API is unavailable', async () => {
    const refresh = await twd.get('[data-testid="vue-refresh"]');
    await userEvent.click(refresh.el);

    await screenDom.findByText('api offline', {
      selector: '[data-testid="vue-greeting"]',
    });
  });
});

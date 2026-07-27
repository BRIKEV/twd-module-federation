import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { reset } from '@poc/bus';

/**
 * This suite belongs to the Vue team and runs on :3003 only.
 *
 * Line for line the same shape as the two React suites — TWD queries the DOM
 * and the accessibility tree, so it neither knows nor cares that this component
 * is Vue.
 */

const counterReaches = (value: string) =>
  screenDom.findByText(value, { selector: '[data-testid="vue-count"]' });

const greetingReads = (text: string) =>
  screenDom.findByText(text, { selector: '[data-testid="vue-greeting"]' });

describe('Vue microfrontend', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    reset('test setup');
  });

  it('renders on Vue 3', async () => {
    const badge = await screenDom.findByText(/^vue 3\./);
    twd.should(badge, 'be.visible');
  });

  it('increments the shared counter', async () => {
    await counterReaches('0');

    await userEvent.click(await screenDom.findByRole('button', { name: '+1' }));

    await counterReaches('1');
  });

  it('renders the greeting from its own mocked endpoint', async () => {
    await twd.mockRequest('vueGreeting', {
      method: 'GET',
      url: '/api/vue/greeting',
      response: { message: 'hello from the vue mock' },
    });

    await userEvent.click(
      await screenDom.findByRole('button', { name: 'Reload greeting' }),
    );

    await twd.waitForRequest('vueGreeting');
    await greetingReads('hello from the vue mock');
  });

  it('falls back when its API is unavailable', async () => {
    await userEvent.click(
      await screenDom.findByRole('button', { name: 'Reload greeting' }),
    );

    await greetingReads('api offline');
  });
});

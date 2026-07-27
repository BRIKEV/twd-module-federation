import { twd, userEvent, screenDom } from 'twd-js';
import { describe, it, beforeEach } from 'twd-js/runner';
import { reset } from '@poc/bus';

/**
 * This suite belongs to the legacy team and runs on :3002 only.
 *
 * Note there is nothing React-17-specific in here — no shallow rendering, no
 * enzyme, no test renderer. TWD queries the real accessibility tree, so the
 * same test API works against a class component on React 17 and a hooks
 * component on React 19. That is what lets these tests survive the migration.
 */

const counterReaches = (value: string) =>
  screenDom.findByText(value, { selector: '[data-testid="legacy-count"]' });

const greetingReads = (text: string) =>
  screenDom.findByText(text, { selector: '[data-testid="legacy-greeting"]' });

describe('Legacy React microfrontend', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    reset('test setup');
  });

  it('renders on React 17', async () => {
    const badge = await screenDom.findByText(/^react 17\./);
    twd.should(badge, 'be.visible');
  });

  it('increments the shared counter', async () => {
    await counterReaches('0');

    await userEvent.click(await screenDom.findByRole('button', { name: '+1' }));

    await counterReaches('1');
  });

  it('renders the greeting from its own mocked endpoint', async () => {
    await twd.mockRequest('legacyGreeting', {
      method: 'GET',
      url: '/api/legacy/greeting',
      response: { message: 'hello from the legacy mock' },
    });

    await userEvent.click(
      await screenDom.findByRole('button', { name: 'Reload greeting' }),
    );

    await twd.waitForRequest('legacyGreeting');
    await greetingReads('hello from the legacy mock');
  });

  it('falls back when its API is unavailable', async () => {
    await userEvent.click(
      await screenDom.findByRole('button', { name: 'Reload greeting' }),
    );

    await greetingReads('api offline');
  });
});

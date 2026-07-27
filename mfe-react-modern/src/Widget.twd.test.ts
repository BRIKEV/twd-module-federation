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

/**
 * Waits for the counter to *reach* a value.
 *
 * `findBy*` retries, so putting the expected value in the query rather than in
 * a following assertion is what makes this immune to re-render timing. The
 * counter is an `<output>` (implicit role=status), so the selector is a
 * semantic element rather than a test id, and a stray digit elsewhere on the
 * card can never match it.
 */
const counterReaches = (value: string) =>
  screenDom.findByText(value, { selector: 'output' });

describe('Modern React microfrontend', () => {
  beforeEach(() => {
    twd.clearRequestMockRules();
    // The test can drive the shared store directly, which is the cheapest way
    // to make the counter assertions deterministic.
    reset('test setup');
  });

  it('renders on React 19', async () => {
    twd.should(await screenDom.findByText(/^react\s19\./), 'be.visible');
    // The counter is exposed to assistive tech as a live region.
    twd.should(await screenDom.findByRole('status'), 'be.visible');
  });

  it('increments the shared counter', async () => {
    await counterReaches('0');

    await userEvent.click(await screenDom.findByRole('button', { name: '+1' }));

    await counterReaches('1');
  });

  it('renders the greeting from its own mocked endpoint', async () => {
    await twd.mockRequest('modernGreeting', {
      method: 'GET',
      url: '/api/modern/greeting',
      response: { message: 'hello from the modern mock' },
    });

    await userEvent.click(
      await screenDom.findByRole('button', { name: 'Reload greeting' }),
    );

    await twd.waitForRequest('modernGreeting');
    // Unique on the page, so plain text is enough — no scoping needed.
    await screenDom.findByText('hello from the modern mock');
  });

  it('falls back when its API is unavailable', async () => {
    // No mock rule registered, so the request 404s against the dev server.
    await userEvent.click(
      await screenDom.findByRole('button', { name: 'Reload greeting' }),
    );

    await screenDom.findByText('api offline');
  });
});

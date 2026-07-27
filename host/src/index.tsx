// Async boundary. Module Federation has to negotiate the shared scope before
// any shared module is evaluated, so the real entry is dynamically imported.
import('./bootstrap');

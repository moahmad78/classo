import { runIso01Check } from './check-iso-01.js';

const passed = runIso01Check();
if (!passed) {
  process.exit(1);
}

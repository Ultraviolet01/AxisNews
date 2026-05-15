import cron from 'node-cron';
import { runEdition } from './pipeline';

export function startScheduler() {
  // 7:00 AM daily — morning edition
  cron.schedule('0 7 * * *', async () => {
    console.log('[AXIS SCHEDULER] Starting morning edition...');
    try {
      await runEdition('morning');
    } catch (error) {
      console.error('[AXIS SCHEDULER] Morning edition failed:', error);
    }
  }, { timezone: 'America/New_York' });

  // 9:00 PM daily — night edition
  cron.schedule('0 21 * * *', async () => {
    console.log('[AXIS SCHEDULER] Starting night edition...');
    try {
      await runEdition('night');
    } catch (error) {
      console.error('[AXIS SCHEDULER] Night edition failed:', error);
    }
  }, { timezone: 'America/New_York' });

  console.log('[AXIS SCHEDULER] Active — broadcasts at 7 AM and 9 PM ET');
}

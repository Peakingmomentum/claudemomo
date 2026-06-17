// Product tours powered by driver.js. Driven from the dashboard (welcome tour on
// first run) and the Help center ("Take a tour" buttons). All calls happen in the
// browser (event handlers / effects), so driver.js never runs during SSR.
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

type Step = {
  element?: string;
  popover: { title: string; description: string; side?: any; align?: any };
};

function run(steps: Step[], onDone?: () => void) {
  // Only target steps whose element actually exists (layout differs desktop/mobile).
  const visible = steps.filter(s => !s.element || (typeof document !== 'undefined' && document.querySelector(s.element)));
  if (!visible.length) return;
  const d = driver({
    showProgress: true,
    allowClose: true,
    nextBtnText: 'Next →',
    prevBtnText: '← Back',
    doneBtnText: 'Done',
    steps: visible as any,
    onDestroyed: () => onDone?.(),
  });
  d.drive();
}

export function runWelcomeTour(onDone?: () => void) {
  run([
    { popover: { title: '👋 Welcome to Pocket Pilot', description: 'Quick 30-second tour to your first win. Pocket Pilot is your AI real-estate copilot — it works your leads <i>with</i> you.' } },
    { element: '[data-tour="chat-input"]', popover: { title: '🔥 Your first win — meet Pilot', description: 'Type a lead in plain English, e.g. <b>“Add John Smith, motivated seller, 555-1234”</b>, and press Enter. Pilot adds it straight to your pipeline. Try it right after this tour!' } },
    { element: '[data-tour="nav-leads"]', popover: { title: 'Your Pipeline', description: 'Every lead lives here — as a scrollable <b>List</b> or a temperature <b>Board</b>: New → Cold → Warm → Hot → Closed.' } },
    { element: '[data-tour="nav-intel"]', popover: { title: 'Daily Intel', description: 'Your morning brief: top-priority leads, tasks due, yesterday’s wins, and an interactive check-in with Pilot.' } },
    { element: '[data-tour="nav-help"]', popover: { title: 'Help is always here', description: 'Guided tours and docs for every feature live in <b>Help</b>. Replay this tour anytime.' } },
  ], onDone);
}

const AREA_TOURS: Record<string, Step[]> = {
  pipeline: [
    { element: '[data-tour="view-toggle"]', popover: { title: 'List ⇄ Board', description: 'Switch between a scrollable contact <b>List</b> and the temperature <b>Board</b>. Your choice is saved as your default.' } },
    { element: '[data-tour="add-lead"]', popover: { title: 'Add a lead', description: 'Add one manually here — or just tell Pilot in chat and it does it for you.' } },
    { element: '[data-tour="archived"]', popover: { title: 'Archived leads', description: 'Deleted or dead leads land here and can be <b>restored</b> any time — nothing is lost.' } },
  ],
  copilot: [
    { element: '[data-tour="chat-input"]', popover: { title: 'Talk to Pilot', description: 'Plain English works: “add a lead”, “move Rebecca to Hot”, “text John a follow-up”, “what should I do today?”. Pilot takes real actions in your pipeline & calendar.' } },
    { element: '[data-tour="chat-input"]', popover: { title: 'Voice & memory', description: 'Tap the 🎤 to talk instead of type. Tell Pilot “remember to never…” and it keeps that rule forever.' } },
  ],
  intel: [
    { popover: { title: 'Your daily briefing', description: 'Top priority leads, tasks due today/overdue, appointments, and yesterday’s wins — refreshed each morning.' } },
    { element: '[data-tour="checkin"]', popover: { title: 'Morning check-in', description: 'Pilot walks you through your tasks one at a time and logs your updates as you go.' } },
  ],
  calculators: [
    { popover: { title: 'Deal math, instant', description: 'Role-specific calculators (ARV, cap rate, DSCR, commissions…) that compute live as you type.' } },
  ],
  affiliate: [
    { popover: { title: 'Earn 30% recurring', description: 'Share your referral link; every paying signup earns you 30% monthly. Track referrals and earnings here.' } },
  ],
};

export function runTour(key: string) {
  const steps = AREA_TOURS[key];
  if (steps) run(steps);
}

// Forms have no backend yet: on submit they build a pre-filled email to Walkover that the
// visitor sends from their own mail app. Swap `deliver` for an API call when a backend exists.
const TO = 'info@walkover.in';

function mailto(subject, fields) {
  const body = Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}:\n${v}`)
    .join('\n\n');
  return `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Wire a <form> so submit validates, calls onSubmit(values) for the 3D reaction,
 * then reveals a "send" link with the email pre-filled.
 */
export function wireForm(form, { subject, labels, onSubmit }) {
  const done = form.querySelector('.form-done');
  const send = form.querySelector('.form-send');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const fields = Object.fromEntries(Object.entries(labels).map(([key, label]) => [label, (data[key] || '').trim()]));
    send.href = mailto(typeof subject === 'function' ? subject(data) : subject, fields);
    form.classList.add('submitted');
    done.hidden = false;
    done.focus?.();
    onSubmit?.(data);
  });
  form.querySelector('.form-reset')?.addEventListener('click', () => {
    form.reset();
    form.classList.remove('submitted');
    done.hidden = true;
  });
}

/** Markup for the "plant your idea" form, shared by Home and Join. */
export const ideaFormHTML = `
  <form class="idea-form box" novalidate>
    <label>Your idea<textarea name="idea" rows="3" maxlength="400" required placeholder="e.g. An app that helps farmers in MP sell directly to cities"></textarea></label>
    <div class="row">
      <label>Name<input name="name" required autocomplete="name" placeholder="Your name" /></label>
      <label>You are a…
        <select name="who">
          <option>Student</option><option>Founder</option><option>Engineer / Designer</option><option>Just curious</option>
        </select>
      </label>
    </div>
    <label>Email <span class="opt">(so we can reply)</span><input name="email" type="email" autocomplete="email" placeholder="you@example.com" /></label>
    <button class="btn primary" type="submit">Plant it ✦</button>
    <div class="form-done" hidden tabindex="-1">
      <p><b>Your seed is planted.</b> One last step — send it to the Walkover team from your mail app.</p>
      <div class="cta-row"><a class="btn primary form-send" href="#">Send to Walkover →</a><button type="button" class="btn ghost form-reset">Plant another</button></div>
    </div>
  </form>`;

export const ideaFormLabels = { idea: 'Idea', name: 'Name', who: 'I am a', email: 'Email' };
export const ideaSubject = (d) => `New idea for Walkover — from ${d.name || 'a visitor'}`;

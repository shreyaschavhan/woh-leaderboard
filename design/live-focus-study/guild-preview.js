// Sample-data interactions, scoped entirely to the added community section.
export function mountGuild(document, template, overlay, onStateChange = () => {}) {
  const $ = id => document.getElementById(id);
  const trainers = JSON.parse($('trainer-data').textContent);
  $('focus-session').after(document.importNode(template.content, true));
  document.body.append(document.importNode(overlay.content, true));
  const roster = new Map(trainers.map(trainer => [trainer.id, trainer]));
  const total = trainers.length;
  const board = document.querySelector('.guild-board');
  const dialog = $('guild-member-dialog');
  let state = 'live';
  let filter = 'all';
  let refreshTimer;
  let minuteOffset = 0;
  let opener;

  // Stable examples for visual review, not claims about anyone's current session.
  const baseSessions = [
    { id: 'Apoorv_S6ag', minutes: 65, phase: 'focus' },
    { id: 'Srishti_QuOP', minutes: 9, phase: 'focus' },
    { id: 'SShbounty_cbhK', minutes: 27, phase: 'focus' },
    { id: 'Momehrust_l0E4', minutes: 32, phase: 'break' }
  ];
  const busySessions = [
    ...baseSessions,
    { id: 'kuro_M3Cr', minutes: 127, phase: 'focus', approximate: true },
    { id: 'Harshit_777', minutes: 18, phase: 'focus' },
    { id: 'RitikBhardwaj', minutes: 42, phase: 'focus' },
    { id: 'Yash_fren', minutes: 48, phase: 'break' }
  ];

  function sessions() {
    if (state === 'empty') return [];
    return (state === 'busy' ? busySessions : baseSessions).filter(item => roster.has(item.id)).map(item => ({
      ...item,
      minutes: item.minutes + (item.phase === 'focus' ? minuteOffset : 0),
      stale: state === 'offline' || (state === 'partial' && item.id === 'Apoorv_S6ag')
    }));
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function sprite(source, className) {
    const image = element('img', className);
    image.src = source;
    image.alt = '';
    image.draggable = false;
    return image;
  }
  function duration(item) { return `${item.approximate ? '≈' : ''}${item.minutes}`; }
  function details(item, button) {
    const trainer = roster.get(item.id);
    opener = button;
    $('guild-dialog-name').textContent = trainer.name;
    $('guild-dialog-avatar').src = trainer.avatar;
    $('guild-dialog-companion').src = trainer.focumon;
    $('guild-dialog-status').textContent = item.stale ? 'Status unconfirmed' : item.phase === 'break' ? 'Taking a break' : 'Focusing';
    $('guild-dialog-minutes').textContent = duration(item);
    $('guild-dialog-caption').textContent = item.stale ? 'last known focus time' : item.phase === 'break' ? 'focused before this break' : 'focused this session';
    $('guild-dialog-link').href = `https://www.focumon.com/focus_with/${encodeURIComponent(item.id)}`;
    dialog.showModal();
  }
  function member(item) {
    const trainer = roster.get(item.id);
    const button = element('button', `guild-member${item.you ? ' is-you' : ''}${item.stale ? ' is-stale' : ''}`);
    button.type = 'button';
    button.dataset.trainer = item.id;
    button.setAttribute('aria-label', `${trainer.name}${item.you ? ', you' : ''}. ${item.stale ? 'Status unconfirmed, last known' : 'Focusing,'} ${item.approximate ? 'about ' : ''}${item.minutes} minutes focused. View details.`);
    button.append(element('span', 'guild-member-status', item.stale ? 'Unconfirmed' : 'Focusing'));
    const arrow = element('span', 'guild-member-link', '↗'); arrow.setAttribute('aria-hidden', 'true'); button.append(arrow);
    const art = element('span', 'guild-member-art'); art.setAttribute('aria-hidden', 'true');
    art.append(element('span','guild-member-ground'),sprite(trainer.avatar,'guild-member-avatar'),sprite(trainer.focumon,'guild-member-companion'));
    const info = element('span','guild-member-info');
    const nameBlock = element('span');
    const name = element('span','guild-member-name',trainer.name);
    if (item.you) name.append(element('span','guild-you','YOU'));
    nameBlock.append(name,element('span','guild-member-caption',item.stale ? 'Last known focus time' : 'Focused this session'));
    const time = element('span',`guild-member-time${String(item.minutes).length > 2 ? ' is-long' : ''}`);
    time.append(element('strong','',duration(item)),element('span','','min'));
    info.append(nameBlock,time); button.append(art,info);
    button.addEventListener('click',()=>details(item,button));
    return button;
  }
  function resting(item) {
    const trainer = roster.get(item.id);
    const button = element('button',`guild-rest-member${item.stale ? ' is-stale' : ''}`);
    button.type = 'button'; button.dataset.trainer = item.id;
    button.setAttribute('aria-label',`${trainer.name}. ${item.stale ? 'Status unconfirmed, last known break.' : 'Taking a break.'} ${item.minutes} minutes focused before this break. View details.`);
    const art = element('span','guild-rest-portrait'); art.setAttribute('aria-hidden','true'); art.append(sprite(trainer.avatar,''));
    const copy = element('span'); copy.append(element('span','guild-rest-name',trainer.name),element('span','guild-rest-detail',item.stale ? 'Last known: on a break' : 'Focus time paused'));
    const time = element('span','guild-rest-duration',duration(item)+' '); time.append(element('small','','min focused'));
    const arrow = element('span','guild-rest-arrow','↗'); arrow.setAttribute('aria-hidden','true');
    button.append(art,copy,time,arrow); button.addEventListener('click',()=>details(item,button)); return button;
  }

  function render() {
    const items = sessions();
    const focused = items.filter(item=>item.phase==='focus');
    const breaks = items.filter(item=>item.phase==='break');
    const unknown = items.filter(item=>item.stale).length;
    const offline = state === 'offline';
    $('focusing-now').dataset.state = state;
    board.dataset.state = state; board.dataset.filter = filter;
    $('guild-focus-count').textContent = offline ? '—' : focused.filter(item=>!item.stale).length;
    $('guild-break-count').textContent = offline ? '—' : breaks.filter(item=>!item.stale).length;
    $('guild-all-count').textContent = items.length;
    $('guild-live-label').textContent = offline ? 'THE SIGNAL IS QUIET' : state==='empty' ? 'A MOMENT BETWEEN QUESTS' : 'THE GUILD IS AWAKE';
    $('guild-updated').textContent = offline ? 'Last checked 3 min ago' : 'Updated just now';
    $('guild-notice').hidden = !unknown;
    $('guild-notice-copy').textContent = offline ? 'Connection lost. These are the last known sessions, not confirmed live activity.' : 'Apoorv’s status couldn’t be refreshed. Their last known time is shown below.';
    $('guild-roster').replaceChildren(...(filter==='break'?[]:focused.map(member)));
    $('guild-roster').hidden = filter==='break'||!focused.length;
    $('guild-roster').classList.toggle('is-busy',state==='busy');
    $('guild-rest-list').replaceChildren(...breaks.map(resting));
    $('guild-rest').hidden = filter==='focus'||!breaks.length;
    const visibleCount = filter==='focus'?focused.length:filter==='break'?breaks.length:items.length;
    $('guild-empty').hidden = visibleCount!==0;
    $('guild-empty-title').innerHTML = filter==='break'&&state!=='empty' ? 'Everyone is<br>in their element.' : 'A quiet moment<br>before the next quest.';
    $('guild-empty-description').textContent = filter==='break'&&state!=='empty' ? 'No one is taking a break right now. Focus time will stay put when they do.' : 'No one is focusing right now. Make a little room for your next chapter.';
    $('guild-roster-size').textContent = total;
    $('guild-coverage').textContent = offline ? 'Last successful check: 3 min ago.' : unknown ? `${total-unknown} of ${total} trainers checked. ${unknown} unconfirmed.` : `All ${total} trainers checked.`;
    document.querySelectorAll('.guild-filters button[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
    $('guild-announcement').textContent = offline ? 'Status unavailable. Last known sessions are displayed.' : `${focused.filter(item=>!item.stale).length} trainers focusing. ${breaks.filter(item=>!item.stale).length} taking a break.${unknown?' One status unconfirmed.':''}`;
  }
  document.querySelectorAll('.guild-filters button').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;render();}));
  $('guild-refresh').addEventListener('click',()=>{
    $('guild-refresh').disabled=true; $('guild-updated').textContent='Checking…';
    refreshTimer=setTimeout(()=>{
      if(state==='offline'||state==='partial') state='live';
      else if(state!=='empty') minuteOffset+=1;
      $('guild-refresh').disabled=false; render(); onStateChange(state);
    },650);
  });
  document.querySelector('.guild-dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>opener?.isConnected&&opener.focus());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});


  render();
  return {
    element: $('focusing-now'),
    setState(next) {
      if (!['live','busy','empty','partial','offline'].includes(next)) return;
      clearTimeout(refreshTimer);
      $('guild-refresh').disabled = false;
      state = next;
      filter = 'all';
      minuteOffset = 0;
      render();
    },
    setVisible(visible) {
      if (!visible && dialog.open) dialog.close();
      $('focusing-now').hidden = !visible;
    }
  };
}

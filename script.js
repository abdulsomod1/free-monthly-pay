// Small interactions: button pulse + smooth reveal
document.addEventListener('DOMContentLoaded',()=>{
  const cta=document.getElementById('cta');
  const modalBackdrop=document.getElementById('modalBackdrop');
  const modalClose=document.getElementById('modalClose');
  const modalCancel=document.getElementById('modalCancel');
  const signupForm=document.getElementById('signupForm');
  const toast=document.getElementById('toast');

  function openModal(){
    modalBackdrop.classList.add('active');
    modalBackdrop.setAttribute('aria-hidden','false');
    // save previously focused element to restore later
    openModal._previouslyFocused = document.activeElement;
    // Focus the first focusable element inside the modal
    const focusable = modalBackdrop.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if(focusable.length) focusable[0].focus();
    // install focus trap
    document.addEventListener('keydown', focusTrapHandler);
  }

  function closeModal(){
    modalBackdrop.classList.remove('active');
    modalBackdrop.setAttribute('aria-hidden','true');
    // remove focus trap
    document.removeEventListener('keydown', focusTrapHandler);
    const prev = openModal._previouslyFocused;
    if(prev && typeof prev.focus === 'function') prev.focus();
  }

  // Focus trap handler keeps Tab/Shift+Tab within the modal while open
  function focusTrapHandler(e){
    if(e.key !== 'Tab' || !modalBackdrop.classList.contains('active')) return;
    const modal = modalBackdrop.querySelector('.modal');
    const focusables = Array.from(modal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])')).filter(el=>el.offsetParent!==null);
    if(!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length-1];
    if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    } else if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    }
  }

  cta.addEventListener('click',()=>{
    cta.classList.add('clicked');
    setTimeout(()=>cta.classList.remove('clicked'),240);
    openModal();
  });

  modalClose.addEventListener('click',closeModal);
  modalCancel.addEventListener('click',closeModal);

  // Close when clicking backdrop (but not when clicking inside modal)
  modalBackdrop.addEventListener('click',(e)=>{
    if(e.target === modalBackdrop) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown',(e)=>{
    if(e.key === 'Escape' && modalBackdrop.classList.contains('active')) closeModal();
  });

  signupForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    if(submitBtn) submitBtn.disabled = true;
    const form = new FormData(signupForm);
    // Robust name extraction: check common fields then fallback to any input that looks like a name
    function getNameFromForm(formEl){
      try{
        const f = new FormData(formEl);
        const candidates = ['name','accountHolderName','account_holder_name','fullname','fullName','full_name'];
        for(const key of candidates){
          const v = f.get(key);
          if(v && String(v).trim()) return String(v).trim();
        }
        // fallback: look for inputs inside the form whose name/id contains 'name'
        const inputs = Array.from(formEl.querySelectorAll('input,select,textarea'));
        for(const inp of inputs){
          const id = (inp.id||'').toLowerCase();
          const nm = (inp.name||'').toLowerCase();
          const ph = (inp.getAttribute('placeholder')||'').toLowerCase();
          if(id.includes('name') || nm.includes('name') || ph.includes('name')){
            const v = inp.value;
            if(v && String(v).trim()) return String(v).trim();
          }
        }
        return '';
      }catch(e){return ''}
    }

    let name = getNameFromForm(signupForm);
    if(!name){
      toast.textContent = 'Please enter a name.';
      toast.classList.add('show');
      setTimeout(()=>toast.classList.remove('show'),4500);
      if(submitBtn) submitBtn.disabled = false;
      return;
    }
    // Remove leading number prefix to avoid double numbering
    name = name.replace(/^\d+\.\s*/, '');
    // Persist submission (only store name + time) in localStorage
    const key = 'fmp_submissions';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if(existing.length && existing[existing.length-1].name === name){
      toast.textContent = 'Duplicate consecutive name not allowed.';
      toast.classList.add('show');
      setTimeout(()=>toast.classList.remove('show'),4500);
      if(submitBtn) submitBtn.disabled = false;
      return;
    }
    // Simulate submission & show toast
    closeModal();
    existing.push({name: name, time: Date.now()});
    localStorage.setItem(key, JSON.stringify(existing));

    // Update UI: add dashboard button (if needed) and refresh list
    addDashboardButton();
    renderDashboardList();

    toast.textContent = `Thanks, ${name} — you were added to the dashboard.`;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),4500);
    signupForm.reset();
    if(submitBtn) submitBtn.disabled = false;
  });

  // -- Dashboard support -------------------------------------------------
  const mainNav = document.getElementById('mainNav');
  const dashboardSection = document.getElementById('dashboardSection');
  const dashboardList = document.getElementById('dashboardList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  function getSubmissions(){
    try{return JSON.parse(localStorage.getItem('fmp_submissions')||'[]')}catch(e){return[]}
  }

  function renderDashboardList(){
    const items = getSubmissions();
    if(!items.length){
      dashboardSection.setAttribute('hidden','true');
      // update badge if present
      const dbBtn = document.getElementById('dashboardBtn');
      if(dbBtn){
        const b = dbBtn.querySelector('.nav-badge');
        if(b){ b.textContent = '0'; b.classList.add('hidden'); }
      }
      return;
    }
    dashboardSection.removeAttribute('hidden');
    dashboardList.innerHTML = '';
    items.forEach((it, idx)=>{
      let displayName = (it.name && it.name.trim()) || (it.email ? String(it.email).split('@')[0] : 'Unnamed');
      // Remove leading number prefix like "1. " to avoid double numbering
      displayName = displayName.replace(/^\d+\.\s*/, '');
      const li = document.createElement('li');
      li.textContent = `${idx+1}. ${displayName}`;
      dashboardList.appendChild(li);
    });
    // Update badge count (if button exists)
    const dbBtn = document.getElementById('dashboardBtn');
    if(dbBtn){
      let b = dbBtn.querySelector('.nav-badge');
      if(!b){
        b = document.createElement('span');
        b.className = 'nav-badge';
        dbBtn.appendChild(b);
      }
      b.textContent = String(items.length);
      b.classList.remove('hidden');
    }
  }

  function addDashboardButton(){
    // If already present, briefly animate
    let btn = document.getElementById('dashboardBtn');
    if(!btn){
      btn = document.createElement('button');
      btn.id = 'dashboardBtn';
      btn.className = 'nav-btn dashboard new';
      btn.type = 'button';
      btn.textContent = 'Dashboard';
      // add badge placeholder
      const badge = document.createElement('span');
      badge.className = 'nav-badge hidden';
      badge.textContent = '0';
      btn.appendChild(badge);
      btn.setAttribute('aria-controls','dashboardSection');
      btn.addEventListener('click',()=>{
        // scroll into view and toggle
        if(dashboardSection.hasAttribute('hidden')){
          renderDashboardList();
          dashboardSection.scrollIntoView({behavior:'smooth',block:'start'});
        } else {
          dashboardSection.setAttribute('hidden','true');
          btn.classList.remove('active');
        }
      });
      mainNav.appendChild(btn);
      // remove 'new' class after animation completes
      setTimeout(()=>btn.classList.remove('new'),1100);
    } else {
      btn.classList.add('new');
      setTimeout(()=>btn.classList.remove('new'),900);
    }
  }

  // Initialize dashboard button if we have stored submissions
  if(getSubmissions().length) addDashboardButton();
  // Render if present
  renderDashboardList();

  // Clear history button
  if(clearHistoryBtn){
    clearHistoryBtn.addEventListener('click',()=>{
      localStorage.removeItem('fmp_submissions');
      renderDashboardList();
      // remove dashboard button if no submissions
      const dbBtn = document.getElementById('dashboardBtn');
      if(dbBtn) dbBtn.remove();
    });
  }

  // simple reduce motion respect
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!mq.matches){
    const els=document.querySelectorAll('.hero-card, .feature-list li, .floating-card');
    els.forEach((el,i)=>{el.style.opacity=0;el.style.transform='translateY(10px)';setTimeout(()=>{el.style.transition='opacity .6s ease,transform .6s ease';el.style.opacity=1;el.style.transform='translateY(0)';},120*i)});
  }
});

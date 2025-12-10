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
    const first = signupForm.querySelector('input');
    if(first) first.focus();
  }

  function closeModal(){
    modalBackdrop.classList.remove('active');
    modalBackdrop.setAttribute('aria-hidden','true');
    cta.focus();
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
    const form = new FormData(signupForm);
    const name = form.get('name');
    const email = form.get('email');
    // Simulate submission & show toast
    closeModal();
    toast.textContent = `Thanks, ${name || 'there'} — we will contact you at ${email || 'your email'}.`;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),4500);
    signupForm.reset();
  });

  // simple reduce motion respect
  const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(!mq.matches){
    const els=document.querySelectorAll('.hero-card, .feature-list li, .floating-card');
    els.forEach((el,i)=>{el.style.opacity=0;el.style.transform='translateY(10px)';setTimeout(()=>{el.style.transition='opacity .6s ease,transform .6s ease';el.style.opacity=1;el.style.transform='translateY(0)';},120*i)});
  }
});

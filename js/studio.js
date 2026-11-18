(() => {
  'use strict';
  const menu=document.querySelector('.mobile-menu');
  const experiences=document.querySelector('.experience-menu');
  experiences?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{experiences.open=false;}));
  document.addEventListener('click',e=>{if(experiences?.open&&!experiences.contains(e.target))experiences.open=false;});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&experiences?.open){experiences.open=false;experiences.querySelector('summary').focus();}});
  menu?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.open=false;}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu?.open){menu.open=false;menu.querySelector('summary').focus();}});
  document.addEventListener('click',e=>{if(menu?.open&&!menu.contains(e.target))menu.open=false;});
  document.querySelectorAll('[data-year]').forEach(n=>{n.textContent=new Date().getFullYear();});
  const loopTabs=[...document.querySelectorAll('[data-loop-tab]')],loopPanels=[...document.querySelectorAll('[data-loop-panel]')];
  function selectStep(index,focus=false){loopTabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});loopPanels.forEach((panel,i)=>{panel.hidden=i!==index;});if(focus)loopTabs[index].focus();}
  loopTabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectStep(i));tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();selectStep(e.key==='Home'?0:e.key==='End'?loopTabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+loopTabs.length)%loopTabs.length,true);});});
  const contact=document.getElementById('studio-contact-form');
  if(contact){
    const ready=window.MindverseContactService?.configured===true,fields=contact.querySelector('fieldset'),button=contact.querySelector('button[type="submit"]'),status=document.getElementById('contact-status'),copy=document.getElementById('copy-inquiry');
    const markup=button.innerHTML;let pending=false,preserved='';fields.disabled=!ready;
    const params=new URLSearchParams(location.search),interest=contact.elements.namedItem('interest'),requested=params.get('interest')==='intuition'?'mindfulness':params.get('interest');
    if([...interest.options].some(o=>o.value===requested))interest.value=requested;
    const topics={'natural-sounds':'Natural Sounds','bedtime-stories':'Bedtime Stories','ambient-worlds':'Ambient Worlds','guided-rest':'Guided Rest','breath-rhythm':'Breath & Rhythm','reflection-space':'Reflection Space','mindfulness':'Mindfulness · Observing decisions','intuition':'Mindfulness · Observing decisions','sahasrara':'Sahasrara','creation':'Imagined music & creation','listening':'Personal listening','instrument':'Creative instruments','collaboration':'Co-creation','character':'Dancing characters','fluid':'Dancing fluid','plasma':'Dancing plasma','research':'BCI research','muladhar':'Root Chakra / Muladhar','swadhisthana':'Sacral Chakra / Swadhisthana','manipura':'Solar Plexus / Manipura','anahata':'Heart Chakra / Anahata','bishuddhi':'Throat Chakra / Bishuddhi','agna':'Third Eye / Agna'};
    const topic=params.get('topic');if(topic)contact.elements.namedItem('topic').value=(topics[topic]||topic.replaceAll('-',' ')).slice(0,160);
    if(!ready)status.textContent='The inquiry form is temporarily unavailable.';
    contact.addEventListener('input',()=>{if(!pending&&ready){status.textContent='';copy.hidden=true;delete status.dataset.state;}});
    contact.addEventListener('submit',async event=>{event.preventDefault();if(!ready||pending||!contact.reportValidity())return;const f=new FormData(contact),value=k=>String(f.get(k)||'').trim(),area=interest.selectedOptions[0].textContent;
      const payload={name:value('name'),email:value('email'),subject:'Studio — '+area+' — '+value('subject'),message:'Website: Mindverse Studio\nArea: '+area+'\nTopic: '+(value('topic')||'General question')+'\nOrganization: '+(value('organization')||'Not provided')+'\n\n'+value('message')};
      preserved='Name: '+payload.name+'\nReply address: '+payload.email+'\nSubject: '+payload.subject+'\n\n'+payload.message;
      pending=true;fields.disabled=true;contact.setAttribute('aria-busy','true');button.textContent='Sending…';status.textContent='Sending your Studio inquiry…';status.dataset.state='pending';copy.hidden=true;
      try{await window.MindverseContactService.send(payload);contact.reset();preserved='';status.textContent='Thank you. Your Studio inquiry has been sent to our team.';status.dataset.state='success';}catch{status.textContent='We couldn’t confirm your inquiry. Your message is still here; you can retry or copy it for your records.';status.dataset.state='error';copy.hidden=false;}finally{pending=false;fields.disabled=false;contact.removeAttribute('aria-busy');button.innerHTML=markup;status.focus();}
    });
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(preserved);copy.textContent='Copied';}catch{copy.textContent='Your message remains in the fields above';}});
  }
  const newsletter=document.getElementById('footer-subscribe-form');
  if(newsletter){
    const ready=window.MindverseSubscriptionService?.configured===true,fields=newsletter.querySelector('fieldset'),button=newsletter.querySelector('button'),note=document.getElementById('subscribe-message'),markup=button.innerHTML;let pending=false;fields.disabled=!ready;
    if(!ready)note.textContent='Subscriptions are temporarily unavailable.';
    newsletter.addEventListener('input',()=>{if(!pending&&ready){note.textContent='';delete note.dataset.state;}});
    newsletter.addEventListener('submit',async e=>{e.preventDefault();if(!ready||pending||!newsletter.reportValidity())return;const email=newsletter.elements.namedItem('email').value.trim();pending=true;fields.disabled=true;button.textContent='Submitting…';newsletter.setAttribute('aria-busy','true');note.textContent='Submitting your subscription request…';
      try{await window.MindverseSubscriptionService.send(email);note.textContent='Thank you. Your subscription request has been submitted.';note.dataset.state='success';newsletter.reset();}catch{note.textContent='We couldn’t confirm your request. Your email has been kept; please try again later.';note.dataset.state='error';}finally{pending=false;fields.disabled=false;button.innerHTML=markup;newsletter.removeAttribute('aria-busy');}
    });
  }
})();

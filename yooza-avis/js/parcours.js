/* Parcours métier connecté. Aucun jeton ou résultat client dans localStorage. */
var Avis={mode:null,config:null,jeton:null,offset:0,original:null,routeGeneration:0};
function avisElement(tag,texte,classe){var e=document.createElement(tag);if(texte!==undefined)e.textContent=texte;if(classe)e.className=classe;return e;}
function avisCarte(parent,titre){var e=avisElement('section',undefined,'avis-carte');if(titre)e.append(avisElement('h2',titre));parent.append(e);return e;}
function avisBouton(parent,texte,fn){var b=avisElement('button',texte,'btn btn-primary');b.type='button';b.addEventListener('click',fn);parent.append(b);return b;}
var avisAlertes={graphiques_et_signatures_non_authentifies_consulter_original:'Images et signatures à vérifier dans l’original',pages_sans_texte_ocr_non_integre:'Pages sans texte exploitable : lecture visuelle nécessaire',clients_contradictoires:'Plusieurs clients contradictoires',adresses_facturation_contradictoires:'Adresses de facturation contradictoires',dates_entete_contradictoires:'Dates d’en-tête contradictoires',duree_declaree_incoherente:'Durée déclarée différente du créneau horaire',continuation_tableau_sans_entete_a_verifier:'Continuation de tableau à vérifier',page_sans_tableau_structure_texte_integral_disponible:'Page sans tableau reconnu : consulter le texte complet'};
var avisErreurs={version_obsolete:'La fiche a changé. Recharge-la avant de continuer.',email_invalide:'L’adresse e-mail est invalide.',
 suivi_a_confirmer:'Confirme la résolution des suites à prévoir et indique ce qui a été réalisé.',
 date_fin_invalide:'Indique une date et une heure réelles de fin, antérieures à maintenant.',
 intervention_non_terminee:'L’intervention doit être confirmée terminée pour préparer une demande.',
 validation_requise:'Vérifie et enregistre la fiche avant de préparer une demande.',email_requis:'Une adresse e-mail est nécessaire.',
 contact_existant_a_selectionner:'Cette adresse est déjà connue. Sélectionne le contact existant dans la fiche.',
 contact_a_verifier:'Les coordonnées du contact ont changé ou ne correspondent pas. Vérifie le contact sélectionné.',
 contact_opted_out:'Ce contact s’oppose aux demandes d’avis.',contact_inactive:'Ce contact est inactif.',
 lien_avis_a_configurer:'Renseigne le lien Google dans Réglages avant de préparer la demande.',
 forbidden:'Ce compte n’est pas autorisé.',unauthenticated:'Reconnecte-toi avec Google.',
 champ_requis:'Complète les champs requis.',lien_avis_invalide:'Utilise le lien HTTPS de la fiche Google Yooza.',
 variante_deja_connue:'Ce fichier est une ancienne variante connue. La version courante reste affichée.',service_indisponible:'Le serveur ne répond pas. Réessaie dans un instant.',serveur_indisponible:'La connexion au serveur est interrompue. Réessaie dans un instant.',pdf_indisponible:'Le PDF ne peut pas être ouvert. Recharge la fiche.',pagination_invalide:'La liste n’a pas pu être chargée. Réessaie.',connexion_google_indisponible:'La connexion Google ne répond pas. Réessaie dans un instant.'};
function avisErreur(parent,error){parent.append(avisElement('p',avisErreurs[error.message]||'L’action n’a pas abouti. Réessaie; si le problème persiste, contacte l’administrateur.','avis-erreur'));}
async function avisApi(path,options){
 var o=options||{},headers=Object.assign({'X-Yooza-Import':'manuel'},o.headers||{});
 if(Avis.jeton)headers.Authorization='Bearer '+Avis.jeton;
 var r=await fetch((Avis.config.apiBase||'/api/v1')+path,Object.assign({},o,{headers:headers,cache:'no-store'}));
 var d=await r.json();if(!r.ok){if(r.status===401){Avis.jeton=null;handleRoute();}throw new Error(d.error?.code||'service_indisponible');}return d.data;
}
function avisSources(parent,sources){if(!sources?.length)return;var d=avisElement('details');d.append(avisElement('summary','Voir les passages sources'));sources.forEach(function(s){d.append(avisElement('p','Page '+s.page,'avis-source'),avisElement('pre',s.extrait,'avis-pre'));});parent.append(d);}
async function initParcoursAvis(){
 try{var r=await fetch('/avis-config',{cache:'no-store'});if(r.status===404){Avis.mode='demo';return false;}if(!r.ok)throw new Error('Configuration indisponible');Avis.config=await r.json();Avis.mode=Avis.config.mode;if(!['local','google'].includes(Avis.mode))throw new Error('Mode inconnu');}
 catch(e){Avis.mode='indisponible';Avis.config={apiBase:'/api/v1'};}
 document.body.classList.add('avis-connected');var badge=document.querySelector('.version-label'),num=document.querySelector('.version');if(badge)badge.textContent=Avis.mode==='local'?'Pilote connecté':'Connexion Google';if(num)num.textContent='Yooza Avis';
 document.querySelectorAll('.nav-item').forEach(function(a){if(a.dataset.route==='/clients'){var label=a.querySelector('.nav-label');if(label)label.textContent='Bons et interventions';}});
 updateTopbarDate();initPwa();handleRoute();return true;
}
async function avisConnexion(parent){
 var c=avisCarte(parent,'Connexion Yooza');
 if(!Avis.config.clientId){c.append(avisElement('p','Le client de connexion Google doit être configuré sur le serveur. Les données restent protégées.'));return;}
 c.append(avisElement('p','Utilise ton compte professionnel autorisé.'));
 var cible=avisElement('div');c.append(cible);
 try{
  if(!window.google?.accounts?.id)await new Promise(function(resolve,reject){var s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=resolve;s.onerror=reject;document.head.append(s);});
  window.google.accounts.id.initialize({client_id:Avis.config.clientId,callback:async function(response){Avis.jeton=response.credential;try{await avisApi('/avis/dashboard');handleRoute();}catch(e){Avis.jeton=null;avisErreur(c,e);}}});
  window.google.accounts.id.renderButton(cible,{type:'standard',theme:'outline',size:'large'});
 }catch(e){avisErreur(c,new Error('connexion_google_indisponible'));}
}
async function avisRoute(){
 var generation=++Avis.routeGeneration,parent=document.getElementById('page-content');parent.replaceChildren();
 if(Avis.original){URL.revokeObjectURL(Avis.original);Avis.original=null;}
 parent.append(avisElement('p',Avis.mode==='local'?'Pilote sur ce HP : données conservées dans PostgreSQL local. Aucun envoi automatique.':'Yooza Avis : données du serveur. Aucun envoi automatique.','avis-bandeau'));
 if(Avis.mode==='indisponible'){avisErreur(parent,new Error('serveur_indisponible'));return;}
 if(Avis.mode==='google'&&!Avis.jeton){await avisConnexion(parent);return;}
 try{
  var hash=location.hash||'#/dashboard';
  if(hash==='#/settings'){await avisReglages(parent);return;}
  if(hash.startsWith('#/bon/')){await avisFiche(parent,hash.split('/')[2],generation);return;}
  if(hash==='#/dashboard'){
   var stats=await avisApi('/avis/dashboard');if(generation!==Avis.routeGeneration)return;
   var g=avisElement('div',undefined,'avis-stats');parent.append(g);
   [['Bons importés',stats.total],['À vérifier',stats.aVerifier],['Terminées',stats.terminees],['Demandes préparées',stats.preparees]].forEach(function(v){var c=avisCarte(g,v[0]);c.append(avisElement('strong',String(v[1])));});
  }
  await avisListe(parent,generation);
 }catch(e){if(generation===Avis.routeGeneration)avisErreur(parent,e);}
}
async function avisListe(parent,generation){
 var c=avisCarte(parent,'Importer un bon PDF'),f=avisElement('form'),input=avisElement('input');input.type='file';input.accept='.pdf,application/pdf';input.required=true;f.append(input);
 var b=avisElement('button','Importer et conserver','btn btn-primary');b.type='submit';f.append(b);c.append(f);
 c.append(avisElement('p','Maximum 5 Mio et 20 pages. Les variantes sont conservées; un PDF n’atteste pas à lui seul la fin des travaux.','avis-texte'));
 f.addEventListener('submit',async function(e){e.preventDefault();b.disabled=true;try{var r=await avisApi('/avis/imports',{method:'POST',headers:{'Content-Type':'application/pdf'},body:input.files[0]});showToast(r.outcome==='importe'?'Bon importé.':r.outcome==='doublon_identique'?'PDF déjà importé.':r.outcome==='variante_deja_connue'?'Ancienne variante connue : ouverture de la version courante.':'Nouvelle variante : validation à refaire.');navigate('/bon/'+r.bon.id);}catch(error){avisErreur(c,error);}finally{b.disabled=false;}});
 var result=await avisApi('/avis/imports?limit=25&offset='+Avis.offset);if(generation!==Avis.routeGeneration)return;
 var liste=avisCarte(parent,'Bons et interventions'),t=avisElement('table',undefined,'avis-table'),h=avisElement('tr');
 ['Bon','Client','Date','État',''].forEach(function(v){h.append(avisElement('th',v));});t.append(h);liste.append(t);
 result.data.forEach(function(bon){var l=bon.extraction.lecture,v=bon.validation,row=avisElement('tr');[l.numeroBon||'À préciser',v?.client||l.details.client?.nom||'À vérifier',l.dateBon||'Non précisée',bon.preparation?'Demande préparée':v?.completed?'Terminée confirmée':v?'Vérifiée, non terminée':'À vérifier'].forEach(function(x){row.append(avisElement('td',x));});var td=avisElement('td');avisBouton(td,'Ouvrir',function(){navigate('/bon/'+bon.id);});row.append(td);t.append(row);});
 if(!result.data.length)liste.append(avisElement('p','Aucun bon enregistré.'));
 var nav=avisElement('div',undefined,'avis-actions');liste.append(nav);
 if(Avis.offset>0)avisBouton(nav,'Précédents',function(){Avis.offset=Math.max(0,Avis.offset-25);handleRoute();});
 if(result.hasMore)avisBouton(nav,'Suivants',function(){Avis.offset=result.nextOffset;handleRoute();});
}
function avisChamp(parent,label,value,type){
 var wrap=avisElement('div'),id='avis-'+Math.random().toString(36).slice(2),l=avisElement('label',label);l.htmlFor=id;
 var input=avisElement(type==='textarea'?'textarea':'input');input.id=id;if(type!=='textarea')input.type=type||'text';input.value=value||'';wrap.append(l,input);parent.append(wrap);return input;
}
function avisCase(parent,label,checked){
 var l=avisElement('label',undefined,'avis-case'),input=avisElement('input');input.type='checkbox';input.checked=Boolean(checked);l.append(input,document.createTextNode(label));parent.append(l);return input;
}
async function avisFiche(parent,id,generation){
 var bon=await avisApi('/avis/imports/'+encodeURIComponent(id));if(generation!==Avis.routeGeneration)return;
 Avis.ficheCourante=bon;var l=bon.extraction.lecture,d=l.details,v=bon.validation,grid=avisElement('div',undefined,'avis-grille'),left=avisElement('div'),right=avisElement('aside',undefined,'avis-original');grid.append(left,right);parent.append(grid);
 var resume=avisCarte(left,'Bon '+(l.numeroBon||'sans numéro confirmé'));
 resume.append(avisElement('p',(l.dateBon||'Date non précisée')+' · '+(l.responsable||'Responsable non précisé')+' · Révision '+bon.revision,'avis-texte'));
 if(d.couverture?.alertes?.length)resume.append(avisElement('p','Points à vérifier : '+d.couverture.alertes.map(function(a){return avisAlertes[a]||a.replaceAll('_',' ');}).join(', '),'avis-texte'));
 var releve=avisCarte(left,'Informations relevées dans le document'),pli=avisElement('details');pli.append(avisElement('summary','Client, émetteur et adresses originales'));releve.append(pli);
 pli.append(avisElement('p','Client : '+(d.client?.nom||'À départager'),'avis-texte'));
 if(d.emetteur)pli.append(avisElement('p','Émetteur : '+(d.emetteur.nom||'Non identifié'),'avis-texte'));
 [['Facturation',d.client?.facturation],['Intervention explicitement indiquée',d.client?.intervention],['Livraison explicitement indiquée',d.client?.livraison]].forEach(function(v){if(v[1]){pli.append(avisElement('h3',v[0]),avisElement('p',v[1].texte,'avis-pre'));avisSources(pli,[v[1].source]);}});
 (d.client?.autresAdresses||[]).forEach(function(a){pli.append(avisElement('h3','Autre adresse, usage non précisé'),avisElement('p',a.texte,'avis-pre'));avisSources(pli,[a.source]);});
 if(d.clientsCandidats?.length>1)d.clientsCandidats.forEach(function(x){pli.append(avisElement('p','Client candidat : '+x.nom));avisSources(pli,[x.source]);});
 if(d.adressesFacturationCandidates?.length>1)d.adressesFacturationCandidates.forEach(function(a){pli.append(avisElement('p','Adresse candidate : '+a.texte,'avis-pre'));avisSources(pli,[a.source]);});
 var travaux=avisCarte(left,'Travaux, articles et quantités');
 (d.prestations||[]).forEach(function(p){travaux.append(avisElement('p',p.description,'avis-pre'));var q=p.horaire?p.horaire.debut+' à '+p.horaire.fin+' · '+(p.horaire.dureeDeclareeMinutes!==null?p.horaire.dureeDeclareeMinutes+' min déclarées':p.horaire.dureeCalculeeMinutes+' min calculées'):p.quantiteBrute? p.quantiteBrute+' '+(p.unite||''):'';if(q)travaux.append(avisElement('p',q,'avis-texte'));avisSources(travaux,p.sources);});
 if(!d.prestations?.length)travaux.append(avisElement('p','Aucune prestation structurée reconnue. Consulte le PDF et son texte complet.'));
 var suivi=avisCarte(left,'Remarques et suites à prévoir');suivi.append(avisElement('p',d.remarques?.texte||'Aucune remarque relevée','avis-pre'));(d.suivisAPrevoir||[]).forEach(function(s){suivi.append(avisElement('p',s.texte,'avis-pre'));avisSources(suivi,s.sources);});
 var original=avisCarte(right,'PDF original'),frame=avisElement('iframe');frame.title='PDF original';original.append(frame);
 var headers={};if(Avis.jeton)headers.Authorization='Bearer '+Avis.jeton;
 var response=await fetch((Avis.config.apiBase||'/api/v1')+'/avis/imports/'+encodeURIComponent(id)+'/pdf',{headers:headers,cache:'no-store'});
 if(!response.ok)throw new Error('pdf_indisponible');var blob=await response.blob();if(generation!==Avis.routeGeneration)return;Avis.original=URL.createObjectURL(new Blob([blob],{type:'application/pdf'}));frame.src=Avis.original;
 var lien=avisElement('a','Ouvrir le PDF original');lien.href=Avis.original;lien.target='_blank';lien.rel='noopener';original.append(lien);
 if(bon.fichiers?.length>1){
  var variantes=avisElement('select');variantes.setAttribute('aria-label','Version du PDF original');
  bon.fichiers.forEach(function(file){var o=avisElement('option',(file.sha256===bon.extraction.sha256?'Version courante':'Ancienne variante')+' · '+new Date(file.createdAt).toLocaleString('fr-BE'));o.value=file.sha256;variantes.append(o);});variantes.value=bon.extraction.sha256;original.append(variantes);
  var pdfGeneration=0;
  variantes.addEventListener('change',async function(){
   var no=++pdfGeneration;try{var r=await fetch((Avis.config.apiBase||'/api/v1')+'/avis/imports/'+encodeURIComponent(id)+'/pdf?sha='+encodeURIComponent(variantes.value),{headers:headers,cache:'no-store'});if(!r.ok)throw Error('pdf_indisponible');var bytes=await r.blob();if(no!==pdfGeneration||generation!==Avis.routeGeneration)return;URL.revokeObjectURL(Avis.original);Avis.original=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));frame.src=Avis.original;lien.href=Avis.original;}catch(e){avisErreur(original,e);}
  });
 }
 var c=avisCarte(left,'Vérification et corrections'),form=avisElement('form',undefined,'avis-form'),champs=avisElement('div',undefined,'avis-champs');form.append(champs);c.append(form);
 var client=avisChamp(champs,'Client',v?.client||d.client?.nom||''),email=avisChamp(champs,'E-mail du destinataire',v?.email||'','email'),adresse=avisChamp(champs,'Adresse de facturation',v?.adresse||d.client?.facturation?.texte||'','textarea'),telephone=avisChamp(champs,'Téléphone',v?.telephone||'');
 client.required=true;client.maxLength=250;email.maxLength=320;adresse.maxLength=1500;telephone.maxLength=50;
 var search=avisChamp(form,'Chercher un contact enregistré',client.value),selection=avisElement('select');selection.setAttribute('aria-label','Contact à rattacher');
 var manual=avisElement('option','Contact manuel, sans sélection existante');manual.value='';selection.append(manual);
 var candidates=[];
 if(v?.contactId){var exist=avisElement('option','Contact déjà rattaché');exist.value=v.contactId;selection.append(exist);selection.value=v.contactId;}
 avisBouton(form,'Chercher le contact',async function(){try{candidates=await avisApi('/avis/contacts?q='+encodeURIComponent(search.value));selection.replaceChildren(manual);candidates.forEach(function(x){var o=avisElement('option',x.name+' · '+(x.email||'sans e-mail')+(x.reviewOptOut?' · opposition aux avis':'')+(!x.active?' · inactif':''));o.value=x.id;selection.append(o);});}catch(e){avisErreur(c,e);}});
 form.append(selection);selection.addEventListener('change',function(){var contact=candidates.find(function(x){return x.id===selection.value;});if(contact){email.value=contact.email||'';telephone.value=contact.phone||'';}});
 var completed=avisCase(form,'Je confirme que l’intervention est terminée.',v?.completed);
 var end=avisChamp(form,'Date et heure réelles de fin',v?.endedAt?new Date(new Date(v.endedAt).getTime()-new Date(v.endedAt).getTimezoneOffset()*60000).toISOString().slice(0,16):'','datetime-local');
 var resolved=avisCase(form,'Les suites à prévoir mentionnées dans ce bon sont résolues.',v?.suiviResolue),notes=avisChamp(form,'Corrections ou confirmation des travaux réalisés',v?.notes||'','textarea');notes.maxLength=4000;
 var save=avisElement('button','Enregistrer la vérification','btn btn-primary');save.type='submit';form.append(save);
 form.addEventListener('submit',async function(e){e.preventDefault();save.disabled=true;try{await avisApi('/avis/imports/'+id+'/validation',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:bon.revision,client:client.value,adresse:adresse.value,email:email.value,telephone:telephone.value,contactId:selection.value||null,completed:completed.checked,endedAt:completed.checked&&end.value?new Date(end.value).toISOString():null,suiviResolue:resolved.checked,notes:notes.value})});showToast('Vérification enregistrée.');handleRoute();}catch(error){avisErreur(c,error);}finally{save.disabled=false;}});
 var prep=avisCarte(left,'Demande d’avis');prep.append(avisElement('p','La préparation crée un aperçu et un brouillon téléchargeable. Aucun message n’est envoyé.','avis-texte'));
 var btn=avisBouton(prep,'Préparer la demande',async function(){btn.disabled=true;try{await avisApi('/avis/imports/'+id+'/preparation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:bon.revision})});showToast('Demande préparée, aucun envoi effectué.');handleRoute();}catch(e){avisErreur(prep,e);}finally{btn.disabled=false;}});
 btn.disabled=!(v?.completed&&v?.email);
 if(bon.preparation)avisApercu(prep,bon.preparation.message);
 var details=avisCarte(left,'Sources et historique');avisSources(details,d.sources?.client);
 var text=avisElement('details');text.append(avisElement('summary','Tout le texte du PDF'),avisElement('pre',d.texteIntegral,'avis-pre'));details.append(text);
 var hist=avisElement('details');hist.append(avisElement('summary','Historique des imports et validations'));(bon.historique||[]).forEach(function(h){hist.append(avisElement('p',new Date(h.createdAt).toLocaleString('fr-BE')+' · '+({'avis.import':'PDF importé','avis.variante':'Nouvelle version reçue','avis.validation':'Vérification enregistrée','avis.preparation':'Demande préparée'}[h.eventType]||h.eventType)+' · révision '+(h.metadata.revision||''),'avis-texte'));if(h.metadata.validation){var vv=h.metadata.validation;hist.append(avisElement('p','Par '+vv.acteur+' : '+vv.client+' · '+vv.email+' · '+(vv.completed?'Fin confirmée':'Travaux non terminés'),'avis-texte'),avisElement('p',vv.notes,'avis-pre'));}});details.append(hist);if(bon.historique?.length===100)details.append(avisElement('p','Les 100 derniers événements sont affichés. L’historique complet est conservé dans la base.','avis-texte'));
 if(bon.fichiers?.length>1)details.append(avisElement('p',bon.fichiers.length+' fichiers originaux conservés. La fiche affiche la version courante.','avis-texte'));
}
function avisApercu(parent,m){
 var c=avisElement('div');c.append(avisElement('p','À : '+m.to),avisElement('p','Objet : '+m.subject),avisElement('pre',m.body,'avis-pre'));parent.append(c);
 avisAfficherQr(c,avisLienMessageQr(m.body));
 avisBouton(c,'Télécharger le brouillon e-mail',function(){
  var subject=btoa(String.fromCharCode.apply(null,new TextEncoder().encode(m.subject))),eml='X-Unsent: 1\r\nTo: '+m.to+'\r\nSubject: =?UTF-8?B?'+subject+'?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n'+m.body.replace(/\r?\n/g,'\r\n');
  var url=URL.createObjectURL(new Blob([eml],{type:'message/rfc822'})),a=avisElement('a');a.href=url;a.download='Yooza-demande-avis-brouillon.eml';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);
 });
}
async function avisReglages(parent){
 var c=avisCarte(parent,'Réglages des demandes'),s=await avisApi('/avis/settings'),f=avisElement('form',undefined,'avis-form'),u=avisChamp(f,'Lien Google pour laisser un avis',s.reviewUrl||'','url');u.required=true;
 c.append(avisElement('p','Colle le lien de demande d’avis de la fiche Google Yooza. Le message sollicite librement le retour du client.','avis-texte'),f);
 var zoneQr=avisElement('div');c.append(zoneQr);avisAfficherQr(zoneQr,s.reviewUrl);
 var b=avisElement('button','Enregistrer le lien','btn btn-primary');b.type='submit';f.append(b);f.addEventListener('submit',async function(e){e.preventDefault();b.disabled=true;try{await avisApi('/avis/settings',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({reviewUrl:u.value})});zoneQr.replaceChildren();avisAfficherQr(zoneQr,u.value);showToast('Lien enregistré.');}catch(error){avisErreur(c,error);}finally{b.disabled=false;}});
 if(Avis.mode==='google')avisBouton(c,'Se déconnecter',function(){Avis.jeton=null;Avis.routeGeneration++;document.getElementById('page-content').replaceChildren();handleRoute();});
}

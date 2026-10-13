/* Interface connectée Yooza. Données métier en mémoire, actions du parcours existant. */
var avisFicheInitiale=avisFiche;
var avisReglagesInitiaux=avisReglages;
Avis.bons=[];Avis.recherche='';Avis.filtre='tous';Avis.page=0;Avis.listeIncomplete=false;Avis.onglets={};Avis.tri='recent';
Avis.gmailImport={cursor:null,lots:[],busy:false,error:null};

function avisIcone(nom){
 var dessins={
  arrow:['M5 12h14','m13 6 6 6-6 6'],back:['M19 12H5','m11 6-6 6 6 6'],plus:['M12 5v14','M5 12h14'],
  file:['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z','M14 2v6h6','M8 13h8','M8 17h5'],
  check:['m5 12 4 4L19 6'],clock:['M12 8v4l3 2'],search:['m21 21-4.4-4.4'],
  mail:['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z','m2 6 10 7L22 6'],
  star:['m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z'],
  upload:['M12 16V3','m7 8 5-5 5 5','M4 16v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4'],
  close:['m6 6 12 12','M18 6 6 18'],shield:['m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z','m8 12 3 3 5-5'],
  tune:['M4 7h16','M4 17h16','M8 4v6','M16 14v6'],download:['M12 3v12','m7 10 5 5 5-5','M4 17v4h16v-4'],
  grid:['M3 3h7v7H3Z','M14 3h7v7h-7Z','M3 14h7v7H3Z','M14 14h7v7h-7Z'],
  location:['M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 0 1 16 0Z']
 };
 var s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.7');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round');s.setAttribute('aria-hidden','true');s.classList.add('avis-icon');
 (dessins[nom]||dessins.file).forEach(function(d){var p=document.createElementNS(s.namespaceURI,'path');p.setAttribute('d',d);s.append(p);});
 if(['clock','search','location'].includes(nom)){var c=document.createElementNS(s.namespaceURI,'circle');c.setAttribute('cx',nom==='search'?'10.5':'12');c.setAttribute('cy',nom==='search'?'10.5':nom==='location'?'10':'12');c.setAttribute('r',nom==='search'?'7.5':nom==='location'?'2.5':'9');s.append(c);}return s;
}
function avisAction(parent,texte,fn,icone,style){var b=avisBouton(parent,texte,fn);if(style)b.className='btn '+style;if(icone)b.prepend(avisIcone(icone));return b;}
function avisLien(parent,texte,route,icone,classe){var a=avisElement('a',texte,classe||'avis-lien');a.href=route;if(icone)a.prepend(avisIcone(icone));parent.append(a);return a;}
function avisEntete(parent,kicker,titre,description){var h=avisElement('div',undefined,'avis-page-heading');h.append(avisElement('h2',titre));if(description)h.append(avisElement('p',description,'avis-description'));parent.append(h);return h;}
function avisPanneau(parent,titre,sousTitre){var c=avisCarte(parent),h=avisElement('header',undefined,'avis-panel-heading');h.append(avisElement('h3',titre));if(sousTitre)h.append(avisElement('p',sousTitre));c.append(h);return c;}
function avisEtat(b){var tentative=b.preparation?.sendAttempt;if(tentative?.state==='sent'&&tentative.verified===true)return {key:'envoye',label:'Envoyé et vérifié',icon:'mail'};if(tentative)return {key:'envoi',label:tentative.state==='failed'?'Envoi échoué':tentative.state==='dispatching'?'Envoi en cours':'Envoi à vérifier',icon:'clock'};if(b.preparation)return {key:'prepare',label:'Demande préparée',icon:'mail'};if(!b.validation)return {key:'verifier',label:'À vérifier',icon:'clock'};if(b.validation.completed)return {key:'termine',label:'Fin confirmée',icon:'check'};return {key:'encours',label:'Travaux en cours',icon:'clock'};}
function avisBadge(b){var e=avisEtat(b),p=avisElement('span',e.label,'avis-badge avis-badge-'+e.key);p.prepend(avisElement('span',undefined,'avis-badge-dot'));return p;}
function avisLecture(b){return b.extraction?.lecture||{};}
function avisNom(b){return b.validation?.client||avisLecture(b).details?.client?.nom||'Client à préciser';}
function avisNormaliser(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
function avisFiltrerBons(bons,recherche,filtre){var q=avisNormaliser(recherche).trim();return bons.filter(function(b){if(filtre==='termine'?!b.validation?.completed:filtre==='prepare'?!b.preparation:filtre!=='tous'&&avisEtat(b).key!==filtre)return false;if(!q)return true;var l=avisLecture(b),v=b.validation,d=l.details||{};return avisNormaliser([avisNom(b),l.numeroBon,l.responsable,l.dateBon,v?.email,v?.telephone,v?.adresse,d.client?.facturation?.texte,d.travaux,(d.prestations||[]).map(function(p){return p.description;}).join(' ')].join(' ')).includes(q);});}
function avisDate(s){if(!s)return 'Date à préciser';var d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(s)?s+'T12:00:00':s);return Number.isFinite(d.getTime())?d.toLocaleDateString('fr-BE',{day:'2-digit',month:'short',year:'numeric'}):s;}
function avisInitiales(n){return String(n||'').trim().split(/\s+/).slice(0,2).map(function(s){return s[0];}).join('').toUpperCase()||'Y';}
function avisResumeTravaux(b){var d=avisLecture(b).details||{},p=d.prestations?.[0];return p?.description||d.travaux||'Consulter le bon pour les détails';}
function avisVide(parent,titre,texte,action){var e=avisElement('div',undefined,'avis-empty');e.append(avisIcone('file'),avisElement('h3',titre),avisElement('p',texte));if(action)avisAction(e,action.texte,action.fn,'plus');parent.append(e);}
function avisChargement(parent){parent.setAttribute('aria-busy','true');var c=avisElement('div',undefined,'avis-loading');c.setAttribute('role','status');c.setAttribute('aria-label','Chargement de votre espace');c.append(avisElement('span','Chargement de votre espace…','avis-sr-only'));for(var i=0;i<4;i++)c.append(avisElement('div',undefined,'avis-skeleton'));parent.append(c);}
async function avisChargerBons(generation){
 var bons=[],offset=0,result;do{result=await avisApi('/avis/imports?limit=50&offset='+offset);if(generation!==Avis.routeGeneration)return null;bons.push.apply(bons,result.data);if(result.hasMore&&(!Number.isSafeInteger(result.nextOffset)||result.nextOffset<=offset))throw Error('pagination_invalide');offset=result.nextOffset;}while(result.hasMore&&bons.length<2000);
 Avis.listeIncomplete=Boolean(result.hasMore);Avis.bons=bons;return bons;
}
async function avisChargerDerniersBons(generation){
 var result=await avisApi('/avis/imports?limit=6&offset=0');return generation===Avis.routeGeneration?result.data:null;
}
async function avisRoute(){
 var generation=++Avis.routeGeneration,parent=document.getElementById('page-content');parent.replaceChildren();parent.setAttribute('aria-busy','false');Avis.ficheCourante=null;
 avisAnnulerPdf();
 if(Avis.mode==='indisponible'){avisEntete(parent,'YOOZA AVIS','Votre espace est indisponible','La connexion au serveur doit être rétablie pour afficher vos données.');avisAction(parent,'Réessayer',function(){location.reload();},'arrow');return;}
 if(Avis.mode==='google'&&!Avis.jeton){Avis.bons=[];await avisConnexion(parent);return;}
 avisChargement(parent);
 try{var hash=location.hash||'#/dashboard';if(hash==='#/settings'){await avisReglages(parent,generation);}else if(hash.startsWith('#/bon/')){await avisFiche(parent,hash.split('/')[2],generation);}else{
  if(hash==='#/clients'||hash==='#/demandes'){
   var bons=await avisChargerBons(generation);if(generation!==Avis.routeGeneration||!bons)return;parent.replaceChildren();
   if(hash==='#/clients')avisVueListe(parent,bons,false);else avisVueDemandes(parent,bons);
  }else{
   var values=await Promise.allSettled([avisApi('/avis/dashboard'),avisChargerDerniersBons(generation)]);if(generation!==Avis.routeGeneration)return;
   if(values.every(function(v){return v.status==='rejected';}))throw values[0].reason;
   parent.replaceChildren();var stats=values[0].status==='fulfilled'?values[0].value:null,recents=values[1].status==='fulfilled'?values[1].value:[];
   avisVueDashboard(parent,stats,recents||[]);
   if(values[0].status==='rejected')avisErreur(parent,new Error('compteurs_indisponibles'));
   if(values[1].status==='rejected')avisErreur(parent,new Error('derniers_bons_indisponibles'));
  }
 }}catch(e){if(generation===Avis.routeGeneration){parent.replaceChildren();avisEntete(parent,'YOOZA AVIS','Une action est à reprendre','Vos informations enregistrées restent conservées.');avisErreur(parent,e);avisAction(parent,'Réessayer',function(){handleRoute();},'arrow');}}
 finally{if(generation===Avis.routeGeneration)parent.setAttribute('aria-busy','false');}
}
function avisOuvrirImport(){
 var d=avisElement('dialog',undefined,'avis-import-dialog'),f=avisElement('form'),busy=false;f.method='dialog';d.append(f);document.body.append(d);
 var head=avisElement('div',undefined,'avis-dialog-heading');head.append(avisElement('div',undefined,'avis-import-symbol'));head.firstChild.append(avisIcone('upload'));var close=avisAction(head,'',function(){d.close();},'close','btn-ghost');close.setAttribute('aria-label','Fermer l’import');var titreImport=avisElement('h2','Importer un bon PDF');titreImport.id='avis-import-titre';d.setAttribute('aria-labelledby',titreImport.id);f.append(head,titreImport,avisElement('p','Importez votre bon d’intervention pour retrouver ses informations et préparer sa vérification.','avis-description'));
 var input=avisElement('input');input.type='file';input.accept='.pdf,application/pdf';input.hidden=true;input.id='avis-import-fichier';f.append(input);
 var zone=avisElement('div',undefined,'avis-drop-zone'),nom=avisElement('strong','Choisissez votre bon d’intervention'),taille=avisElement('p','PDF · 5 Mio maximum · 20 pages maximum');zone.append(avisIcone('file'),nom,taille);f.append(zone);
 var choisi=avisAction(zone,'Choisir un PDF',function(){input.click();},'plus','btn-secondary');var actions=avisElement('div',undefined,'avis-dialog-actions'),submit=avisElement('button','Importer et conserver','btn btn-primary');submit.type='submit';submit.disabled=true;submit.prepend(avisIcone('arrow'));actions.append(submit);f.append(actions);
 function selection(){var file=input.files[0];nom.textContent=file?file.name:'Choisissez votre bon d’intervention';taille.textContent=file?Math.ceil(file.size/1024)+' Ko · prêt à importer':'PDF · 5 Mio maximum · 20 pages maximum';submit.disabled=!file;}
 input.addEventListener('change',selection);zone.addEventListener('dragover',function(e){e.preventDefault();zone.classList.add('is-dragging');});zone.addEventListener('dragleave',function(){zone.classList.remove('is-dragging');});zone.addEventListener('drop',function(e){e.preventDefault();zone.classList.remove('is-dragging');if(busy)return;var files=e.dataTransfer?.files;if(files?.length){input.files=files;selection();}});
 d.addEventListener('cancel',function(e){if(busy)e.preventDefault();});d.addEventListener('close',function(){d.remove();});
 f.addEventListener('submit',async function(e){e.preventDefault();if(!input.files[0]||busy)return;busy=true;submit.disabled=choisi.disabled=close.disabled=true;submit.textContent='Lecture du PDF…';submit.prepend(avisElement('span',undefined,'avis-spinner'));f.querySelectorAll('.avis-erreur').forEach(function(x){x.remove();});try{var r=await avisApi('/avis/imports',{method:'POST',headers:{'Content-Type':'application/pdf'},body:input.files[0]});d.close();showToast(r.outcome==='importe'?'Bon importé.':r.outcome==='doublon_identique'?'Ce PDF est déjà conservé.':r.outcome==='variante_deja_connue'?'Ancienne version connue : ouverture du bon courant.':'Nouvelle version : vérification à reprendre.');navigate('#/bon/'+r.bon.id);}catch(error){avisErreur(f,error);}finally{busy=false;submit.disabled=choisi.disabled=close.disabled=false;submit.textContent='Importer et conserver';submit.prepend(avisIcone('arrow'));}});
 d.showModal();choisi.focus();
}
function avisVueDashboard(parent,stats,bons){
 var h=avisEntete(parent,'VOTRE ESPACE YOOZA','Votre tableau de bord.','Vos bons, vos vérifications et vos demandes d’avis, au même endroit.');var refresh=avisAction(h,'Actualiser',function(){handleRoute();},'clock','btn-ghost');refresh.classList.add('avis-heading-action');refresh.setAttribute('aria-label','Actualiser le tableau de bord');
 var intro=avisElement('section',undefined,'avis-workspace-intro'),introText=avisElement('div');introText.append(avisElement('h3','Du terrain au retour client.'),avisElement('p','Un bon conservé, une intervention vérifiée, un message personnalisé.'));intro.append(introText);avisAction(intro,'Importer un PDF',avisOuvrirImport,'plus');parent.append(intro);
 var metrics=avisElement('div',undefined,'avis-metrics');parent.append(metrics);
 [['Bons conservés',stats?.total,'file','tous'],['À vérifier',stats?.aVerifier,'clock','verifier'],['Fin confirmée',stats?.terminees,'check','termine'],['Demandes préparées',stats?.preparees,'mail','prepare']].forEach(function(v){var c=avisElement('button',undefined,'avis-metric');c.type='button';c.append(avisElement('span',v[0]),avisElement('strong',v[1]===undefined?'…':String(v[1])),avisIcone(v[2]));c.addEventListener('click',function(){Avis.filtre=v[3];Avis.recherche='';Avis.page=0;navigate('#/clients');});metrics.append(c);});
 var grid=avisElement('div',undefined,'avis-dashboard-grid'),main=avisElement('div'),aside=avisElement('aside');grid.append(main,aside);parent.append(grid);
 var recent=avisPanneau(main,'Les dernières interventions','Les bons les plus récemment reçus');avisLien(recent.querySelector('header'),'Tout voir','#/clients','arrow');if(bons.length)avisTableBons(recent,bons.slice(0,6));else if(stats?.total===0)avisVide(recent,'Votre premier bon vous attend','Importez un PDF pour commencer le suivi de vos interventions.',{texte:'Importer un PDF',fn:avisOuvrirImport});else avisVide(recent,'La liste récente est indisponible','Ouvrez les bons pour retrouver vos interventions.',{texte:'Voir les bons',fn:function(){navigate('#/clients');}});
 var next=avisPanneau(aside,'Votre prochaine action'),action=avisProchaineAction(stats,bons);next.classList.add('avis-next-action');next.append(avisElement('div',undefined,'avis-next-symbol'));next.lastChild.append(avisIcone(action.icon));
 next.append(avisElement('h4',action.title),avisElement('p',action.description));
 avisAction(next,action.label,function(){if(action.type==='import')avisOuvrirImport();else{if(action.filter){Avis.filtre=action.filter;Avis.recherche='';Avis.page=0;}navigate(action.route);}},'arrow','btn-secondary');
 var note=avisElement('div',undefined,'avis-manual-note');note.append(avisIcone('shield'),avisElement('p','Vous gardez la main. L’import et la préparation n’envoient rien. L’envoi demande votre confirmation.'));aside.append(note);
 avisImportGmail(main,Avis.routeGeneration);
}
function avisProchaineAction(stats,bons){
 var prochaine=stats?.nextAction,type=prochaine?.type,id=prochaine?.id,client=prochaine?.client,numero=prochaine?.numeroBon;
 function choisir(b,t){type=t;id=b?.id;client=b&&avisNom(b);numero=b&&avisLecture(b).numeroBon;}
 if(!type){
  var b=bons.find(function(x){return !x.validation;});
  if(b||stats?.aVerifier>0)choisir(b,'verifier');
  else {b=bons.find(function(x){return x.validation?.completed&&!x.preparation;});
   if(b||(stats?.terminees||0)>(stats?.preparees||0))choisir(b,'preparer');
   else {b=bons.find(function(x){return x.validation&&!x.validation.completed&&!x.preparation;});
    if(b||(stats&&stats.total-stats.aVerifier-stats.terminees>0))choisir(b,'encours');
    else {b=bons.find(function(x){return Boolean(x.preparation);});if(b||stats?.preparees>0)choisir(b,'relire');}
   }
  }
 }
 var descriptions={verifier:'Vérifiez les informations et l’état des travaux avant de préparer un message.',preparer:'La fin des travaux est confirmée. Ouvrez la fiche pour préparer le message.',encours:'Confirmez la fin des travaux quand l’intervention sera terminée.',relire:'Retrouvez le message préparé et les coordonnées du destinataire.'},titles={verifier:'Un bon à vérifier',preparer:'Une demande à préparer',encours:'Une intervention à suivre',relire:'Un brouillon à relire'},filters={verifier:'verifier',preparer:'termine',encours:'encours'};
 if(titles[type])return {type:type,title:titles[type],description:id?(client||'Client à préciser')+' · bon '+(numero||'sans numéro'):descriptions[type],label:id?'Ouvrir le bon':type==='relire'?'Voir les demandes':'Voir les bons',route:id?'#/bon/'+id:type==='relire'?'#/demandes':'#/clients',filter:id?null:filters[type],icon:type==='preparer'||type==='relire'?'mail':'check'};
 if(!stats)return {type:'consulter',title:'Retrouver vos interventions',description:'Ouvrez les bons pour poursuivre votre travail.',label:'Voir les bons',route:'#/clients',filter:'tous',icon:'file'};
 return {type:'import',title:'Tout commence par un bon',description:'Importez votre PDF, puis complétez les informations du client.',label:'Importer un PDF',icon:'file'};
}
function avisTableBons(parent,bons){
 var wrap=avisElement('div',undefined,'avis-data-wrap'),table=avisElement('table',undefined,'avis-data-table'),head=avisElement('thead'),hr=avisElement('tr');['Client / bon','Intervention','Date','État',''].forEach(function(x){var th=avisElement('th',x);th.scope='col';hr.append(th);});head.append(hr);table.append(head);var body=avisElement('tbody');table.append(body);wrap.append(table);parent.append(wrap);
 var mobile=avisElement('div',undefined,'avis-bon-cards');parent.append(mobile);
 bons.forEach(function(b){var l=avisLecture(b),row=avisElement('tr'),cell=avisElement('td'),who=avisElement('div',undefined,'avis-client-cell'),avatar=avisElement('span',avisInitiales(avisNom(b)),'avis-client-avatar'),name=avisElement('div');avisLien(name,avisNom(b),'#/bon/'+b.id,null,'avis-client-name');name.append(avisElement('small','Bon '+(l.numeroBon||'à préciser')));who.append(avatar,name);cell.append(who);row.append(cell);var work=avisElement('td');work.append(avisElement('p',avisResumeTravaux(b),'avis-work-summary'));row.append(work,avisElement('td',avisDate(l.dateBon),'avis-table-date'));var state=avisElement('td');state.append(avisBadge(b));row.append(state);var action=avisElement('td'),a=avisLien(action,'','#/bon/'+b.id,'arrow','avis-open-bon');a.setAttribute('aria-label','Ouvrir le bon '+(l.numeroBon||'sans numéro')+' de '+avisNom(b));row.append(action);body.append(row);
  var card=avisElement('a',undefined,'avis-bon-card');card.href='#/bon/'+b.id;var top=avisElement('div',undefined,'avis-bon-card-top');top.append(avisElement('span','BON '+(l.numeroBon||'À PRÉCISER'),'avis-kicker'),avisBadge(b));card.append(top,avisElement('h3',avisNom(b)),avisElement('p',avisResumeTravaux(b),'avis-work-summary'));var bottom=avisElement('div');bottom.append(avisElement('span',avisDate(l.dateBon)),avisIcone('arrow'));card.append(bottom);mobile.append(card);
 });
}
function avisVueListe(parent,bons,demandes){
 var h=avisEntete(parent,demandes?'VOS DEMANDES':'VOS INTERVENTIONS',demandes?'Les demandes préparées.':'Un suivi clair, bon par bon.',demandes?'Des brouillons à retrouver, relire et télécharger.':'Retrouvez un client, un bon ou une prestation en quelques secondes.');if(!demandes)avisAction(h,'Importer un PDF',avisOuvrirImport,'plus').classList.add('avis-heading-action');
 if(!demandes)avisImportGmail(parent,Avis.routeGeneration);
 var panel=avisPanneau(parent,demandes?'Demandes d’avis':'Bons et interventions');panel.classList.add('avis-list-panel');var tools=avisElement('div',undefined,'avis-list-tools'),searchWrap=avisElement('div',undefined,'avis-search');searchWrap.append(avisIcone('search'));var search=avisElement('input');search.type='search';search.placeholder='Rechercher un client, un bon, un travail…';search.setAttribute('aria-label','Rechercher dans les bons');search.dataset.avisSearch='';search.value=Avis.recherche;searchWrap.append(search);tools.append(searchWrap);
 var sort=avisElement('select');sort.setAttribute('aria-label','Trier les bons');[['recent','Plus récents'],['ancien','Plus anciens'],['client','Client A à Z']].forEach(function(o){var e=avisElement('option',o[1]);e.value=o[0];sort.append(e);});sort.value=Avis.tri;tools.append(sort);panel.append(tools);
 var filters=avisElement('div',undefined,'avis-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Filtrer par état');panel.append(filters);var count=avisElement('p',undefined,'avis-list-count');count.setAttribute('aria-live','polite');panel.append(count);var results=avisElement('div',undefined,'avis-list-results');panel.append(results);var pagination=avisElement('div',undefined,'avis-pagination');panel.append(pagination);
 var source=demandes?bons.filter(function(b){return Boolean(b.preparation);}):bons,active=demandes?'tous':Avis.filtre;
 var filterOptions=demandes?[['tous','Tous'],['envoye','Envoyés'],['envoi','Envoi à vérifier']]:[['tous','Tous'],['verifier','À vérifier'],['encours','En cours'],['termine','Fin confirmée'],['prepare','Préparés']];
 filterOptions.forEach(function(o){var b=avisAction(filters,o[1],function(){active=o[0];Avis.filtre=active;Avis.page=0;render();},null,'avis-filter');b.dataset.avisFilter=o[0];var n=o[0]==='tous'?source.length:avisFiltrerBons(source,'',o[0]).length;b.append(avisElement('span',String(n)));});
 function render(){var selected=avisFiltrerBons(source,search.value,active);if(sort.value==='client')selected.sort(function(a,b){return avisNom(a).localeCompare(avisNom(b),'fr');});else if(sort.value==='ancien')selected.reverse();var size=12,max=Math.max(0,Math.ceil(selected.length/size)-1);Avis.page=Math.min(Avis.page,max);results.replaceChildren();pagination.replaceChildren();filters.querySelectorAll('button').forEach(function(b){var on=b.dataset.avisFilter===active;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});count.textContent=selected.length+' '+(demandes?'demande'+(selected.length>1?'s':''):'bon'+(selected.length>1?'s':''))+(search.value||active!=='tous'?' correspondant'+(selected.length>1?'s':''):' au total');
  if(!selected.length)avisVide(results,source.length?'Aucun résultat pour cette recherche':'Aucun '+(demandes?'brouillon préparé':'bon enregistré'),source.length?'Essayez un autre nom ou retirez un filtre.':demandes?'Vérifiez une intervention terminée pour préparer sa demande.':'Importez votre premier PDF pour commencer.',source.length?{texte:'Effacer les filtres',fn:function(){search.value='';Avis.recherche='';active='tous';Avis.filtre='tous';render();}}:demandes?{texte:'Voir les bons',fn:function(){navigate('#/clients');}}:{texte:'Importer un PDF',fn:avisOuvrirImport});else avisTableBons(results,selected.slice(Avis.page*size,(Avis.page+1)*size));
  if(selected.length>size){var prev=avisAction(pagination,'Précédents',function(){Avis.page--;render();},'back','btn-ghost');prev.disabled=Avis.page===0;pagination.append(avisElement('span','Page '+(Avis.page+1)+' sur '+(max+1)));var next=avisAction(pagination,'Suivants',function(){Avis.page++;render();},'arrow','btn-ghost');next.disabled=Avis.page===max;}
 }
 search.addEventListener('input',function(){Avis.recherche=search.value;Avis.page=0;render();});sort.addEventListener('change',function(){Avis.tri=sort.value;Avis.page=0;render();});render();
 if(Avis.listeIncomplete)panel.append(avisElement('p','Recherche limitée aux 2 000 derniers bons chargés. Les autres documents restent conservés.','avis-texte'));
}
function avisVueDemandes(parent,bons){avisVueListe(parent,bons,true);var note=avisElement('div',undefined,'avis-manual-note');note.append(avisIcone('mail'),avisElement('p','Ces demandes sont préparées et conservées. Ouvrez une fiche pour relire le message et télécharger son brouillon e-mail.'));parent.append(note);}

function avisImportGmail(parent,generation){
 var state=Avis.gmailImport,panel=avisPanneau(parent,'Les bons reçus dans Gmail',"direction@yooza.be · 🟢 Bons d'intervention");panel.classList.add('avis-gmail-panel');
 panel.append(avisElement('p','Importez les PDF du libellé sans modifier les messages. Les doublons restent reconnus et les nouveaux bons sont à vérifier.','avis-texte'));
 var bouton=avisAction(panel,state.cursor?'Continuer l’import':'Importer les nouveaux bons',collecter,'mail','btn-secondary');bouton.disabled=state.busy;if(state.busy)bouton.textContent='Import Gmail en cours…';
 if(state.cursor){var recommencer=avisAction(panel,'Recommencer la lecture',function(){if(state.busy)return;state.cursor=null;state.lots=[];state.error=null;handleRoute();},'clock','btn-ghost');recommencer.disabled=state.busy;}
 var bilan=avisElement('div',undefined,'avis-gmail-bilan');bilan.setAttribute('aria-live','polite');panel.append(bilan);
 function afficher(){
  bilan.replaceChildren();if(!state.lots.length)return;
  var total={messagesLus:0,importes:0,doublons:0,refuses:0,erreurs:0};state.lots.forEach(function(lot){total.messagesLus+=lot.messagesLus||0;['importes','doublons','refuses','erreurs'].forEach(function(k){total[k]+=(lot[k]||[]).length;});});
  var chiffres=avisElement('dl',undefined,'avis-import-counts');[['Messages lus',total.messagesLus],['PDF importés',total.importes],['Déjà conservés',total.doublons],['PDF refusés',total.refuses],['À reprendre',total.erreurs]].forEach(function(v){var groupe=avisElement('div');groupe.append(avisElement('dt',v[0]),avisElement('dd',String(v[1])));chiffres.append(groupe);});bilan.append(chiffres);
  bilan.append(avisElement('p',state.cursor?'Des messages restent à traiter. Continuez l’import pour reprendre au même endroit.':'Lecture du libellé terminée pour cet import. Aucun e-mail envoyé.','avis-texte'));
  var dernier=state.lots[state.lots.length-1];['refuses','erreurs'].forEach(function(k){if(!dernier[k]?.length)return;var details=avisElement('details');details.append(avisElement('summary',k==='refuses'?'Documents refusés : voir les raisons':'Éléments à reprendre : voir les raisons'));dernier[k].forEach(function(incident){details.append(avisElement('p',avisRaisonImport(incident.code),'avis-texte'));if(incident.importId)avisLien(details,'Ouvrir le PDF déjà conservé','#/bon/'+incident.importId,'file');});bilan.append(details);});
  if(dernier.importes?.length){var bons=avisElement('details');bons.append(avisElement('summary','Voir les bons de ce lot'));dernier.importes.forEach(function(item){avisLien(bons,item.outcome==='variante_a_verifier'?'Ouvrir la nouvelle version du bon':'Ouvrir le bon conservé','#/bon/'+item.importId,'file');});bilan.append(bons);}
 }
 async function collecter(){
  if(state.busy)return;state.busy=true;state.error=null;bouton.disabled=true;bouton.textContent='Import Gmail en cours…';panel.querySelectorAll('.avis-erreur').forEach(function(e){e.remove();});
  var success=false;try{var cursor=state.cursor,result=await avisApi('/avis/gmail/collecter',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cursor?{pageToken:cursor}:{})});success=true;
   if(!cursor)state.lots=[];state.lots.push(result);state.cursor=result.hasMore&&result.nextCursor?result.nextCursor:null;
   if(generation===Avis.routeGeneration)afficher();
  }catch(error){state.error=error.message;if(generation===Avis.routeGeneration)avisErreur(panel,error);}
  finally{state.busy=false;if(generation===Avis.routeGeneration){bouton.disabled=false;bouton.textContent=state.cursor?'Continuer l’import':'Importer les nouveaux bons';}if(success&&generation===Avis.routeGeneration||generation!==Avis.routeGeneration&&['#/dashboard','#/clients'].includes(location.hash))handleRoute();}
 }
 afficher();if(state.error)avisErreur(panel,new Error(state.error));return panel;
}
function avisRaisonImport(code){
 var textes={pdf_invalide:'Le fichier ne semble pas être un PDF valide.',pdf_illisible:'Ce PDF ne peut pas être lu. Vérifiez le document original.',piece_pdf_invalide:'Cette pièce jointe ne contient pas de PDF lisible.',pages_sans_texte:'Ce document nécessite une lecture visuelle.',taille_invalide:'La pièce jointe dépasse la taille autorisée.',limite_pages:'Le PDF dépasse le nombre de pages autorisé.',pdf_absent:'Ce message ne contient pas de PDF utilisable.',provenance_indisponible:'Le PDF est conservé, mais son lien avec Gmail doit être repris.',lecture_gmail_indisponible:'Un message Gmail n’a pas pu être lu.',piece_gmail_indisponible:'Une pièce jointe n’a pas pu être téléchargée.',envoi_deja_engage:'Ce bon possède déjà une tentative d’envoi. Vérifiez son historique avant de changer le document.',demande_deja_traitee:'Ce bon possède déjà une demande traitée. Vérifiez son historique.',message_hors_libelle:'Ce message n’appartient plus au libellé sélectionné.',delai_pdf_depasse:'La lecture du PDF a dépassé le délai autorisé. Essayez l’import manuel.'};
 return textes[code]||'Le document n’a pas pu être importé complètement. Réessayez l’import ou utilisez son PDF manuellement.';
}
function avisRechercheTeamleader(parent,bon,generation,choisir){
 var zone=avisElement('div',undefined,'avis-crm-picker');parent.append(zone);zone.append(avisElement('h3','Retrouver le client dans Teamleader','avis-form-heading'),avisElement('p','Choisissez la personne ou la société, puis l’adresse e-mail. La sélection ne confirme pas la fin des travaux.','avis-texte'));
 var search=avisChamp(zone,'Nom du client Teamleader',avisNom(bon)),actions=avisElement('div',undefined,'avis-actions');search.maxLength=200;zone.append(actions);
 var bouton=avisAction(actions,'Chercher dans Teamleader',function(){void rechercher(1);},'search','btn-secondary'),retour=avisElement('div');retour.setAttribute('aria-live','polite');zone.append(retour);
 var noRecherche=0,busy=false,query='';
 async function rechercher(page){
  if(busy||generation!==Avis.routeGeneration)return;var q=page===1?search.value.trim():query;if(q.length<2){avisErreur(retour,new Error('recherche_teamleader_invalide'));return;}
  query=q;busy=true;bouton.disabled=true;retour.replaceChildren(avisElement('p','Recherche dans Teamleader…','avis-texte'));var no=++noRecherche;
  try{var result=await avisApi('/avis/teamleader/contacts?query='+encodeURIComponent(query)+'&page='+page+'&limit=20');if(generation!==Avis.routeGeneration||no!==noRecherche)return;retour.replaceChildren();
   if(!result.candidats?.length)retour.append(avisElement('p','Aucun client dans cette page. Affinez le nom ou consultez la suivante.','avis-texte'));
   var select=avisElement('select');select.setAttribute('aria-label','Choisir le client Teamleader');var vide=avisElement('option','Choisissez un client Teamleader');vide.value='';select.append(vide);(result.candidats||[]).forEach(function(c,i){var o=avisElement('option',c.name+' · '+(c.type==='company'?'Société':'Personne')+' · '+(c.email||((c.emails||[]).length?(c.emails||[]).length+' e-mails':'sans e-mail')));o.value=String(i);select.append(o);});if(result.candidats?.length)retour.append(select);
   var fiche=avisElement('div',undefined,'avis-crm-choice');retour.append(fiche);select.addEventListener('change',function(){if(busy)return;fiche.replaceChildren();var candidat=result.candidats[Number(select.value)];if(select.value===''||!candidat)return;
    fiche.append(avisElement('strong',candidat.name),avisElement('p',candidat.type==='company'?'Société Teamleader':'Contact Teamleader','avis-texte'));var mails=[...new Set((candidat.emails||[]).map(function(e){return e.address;}).filter(Boolean))],mail=avisElement('select');mail.setAttribute('aria-label','Adresse e-mail du client Teamleader');
    if(mails.length!==1){var placeholder=avisElement('option',mails.length?'Choisissez l’e-mail du destinataire':'Aucun e-mail disponible');placeholder.value='';mail.append(placeholder);}mails.forEach(function(e){var o=avisElement('option',e);o.value=e;mail.append(o);});if(mails.length===1)mail.value=mails[0];else mail.value='';fiche.append(mail);
    if(candidat.active===false)fiche.append(avisElement('p','Ce client est inactif. Il ne peut pas être utilisé pour une demande.','avis-erreur'));else if(candidat.active===null)fiche.append(avisElement('p','Le statut actif n’est pas précisé dans Teamleader.','avis-texte'));
    var utiliser=avisAction(fiche,'Utiliser ce client',async function(){if(busy||!mail.value||candidat.active===false||generation!==Avis.routeGeneration)return;var selectedClient=select.value,selectedEmail=mail.value;busy=true;utiliser.disabled=bouton.disabled=select.disabled=mail.disabled=search.disabled=true;
     try{var linked=await avisApi('/avis/imports/'+encodeURIComponent(bon.id)+'/contact-teamleader',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:bon.revision,type:candidat.type,id:candidat.id,email:selectedEmail})});if(generation!==Avis.routeGeneration||select.value!==selectedClient||mail.value!==selectedEmail)return;choisir(linked);fiche.replaceChildren(avisElement('p','Client Teamleader rattaché. Vérifiez les coordonnées et enregistrez la vérification.','avis-texte'));}
     catch(error){if(generation===Avis.routeGeneration)avisErreur(fiche,error);}finally{busy=false;if(generation===Avis.routeGeneration){bouton.disabled=select.disabled=mail.disabled=search.disabled=false;utiliser.disabled=!mail.value||candidat.active===false;}}
    },'check','btn-secondary');function activer(){utiliser.disabled=busy||!mail.value||candidat.active===false;}mail.addEventListener('change',activer);activer();
   });
   var pages=Object.values(result.pages||{}),hasMore=pages.some(function(p){return p.nextPage>page;});if(pages.some(function(p){return p.error;}))retour.append(avisElement('p','Certains résultats Teamleader ne sont pas disponibles. Vous pouvez choisir parmi les résultats affichés ou relancer la recherche.','avis-texte'));
   if(hasMore)avisAction(retour,'Voir la page suivante',function(){void rechercher(page+1);},'arrow','btn-ghost');
  }catch(error){if(generation===Avis.routeGeneration&&no===noRecherche){retour.replaceChildren();avisErreur(retour,error);}}
  finally{busy=false;if(generation===Avis.routeGeneration&&no===noRecherche)bouton.disabled=false;}
 }
 return zone;
}
function avisEnvoi(parent,bon,generation,saved){
 var zone=avisElement('div',undefined,'avis-send-panel');parent.append(zone);zone.append(avisElement('h3','Envoyer la demande','avis-form-heading'),avisElement('p','Pilote : envoi depuis direction@yooza.be vers une adresse @yooza.be. Vérifiez le message avant de confirmer.','avis-texte'));
 var bouton=avisAction(zone,'Vérifier l’aperçu avant envoi',function(){void apercu();},'mail','btn-secondary'),resultat=avisElement('div',undefined,'avis-send-result');resultat.setAttribute('aria-live','polite');zone.append(resultat);var busy=false,sendLocked=false;
 function etat(tentative){
  resultat.replaceChildren();var verified=tentative.state==='sent'&&tentative.verification==='verified'&&tentative.envoiEffectue===true;
  var titre=verified?'E-mail envoyé et vérifié':tentative.state==='failed'?'L’envoi a échoué':tentative.state==='dispatching'?'Envoi en cours de vérification':'Le résultat de l’envoi reste incertain';
  resultat.append(avisElement('strong',titre,'avis-send-state'),avisElement('p',verified?'L’envoi est enregistré. Cette demande ne sera pas envoyée une deuxième fois.':tentative.state==='failed'?'Aucun nouvel envoi n’est proposé. Consultez l’historique avant toute reprise.':'Vérifiez la boîte Gmail avant toute reprise. L’application ne relance pas cet envoi.','avis-texte'));
  var badge=saved.querySelector('.avis-preview-state');if(badge)badge.textContent=verified?'Envoi vérifié':tentative.state==='failed'?'Envoi échoué':'Envoi à vérifier';
  bouton.hidden=true;sendLocked=true;avisAction(resultat,'Actualiser l’état',function(){void apercu();},'clock','btn-ghost');
 }
 async function apercu(){
  if(busy||generation!==Avis.routeGeneration)return;busy=true;bouton.disabled=true;resultat.replaceChildren(avisElement('p','Vérification du message enregistré…','avis-texte'));
  try{var preview=await avisApi('/avis/imports/'+encodeURIComponent(bon.id)+'/envoi/apercu');if(generation!==Avis.routeGeneration)return;if(preview.state){etat(preview);return;}
   if(preview.bonId!==bon.id||preview.revision!==bon.revision||!preview.message||!preview.fingerprint||preview.confirmationRequired!==true)throw Error('apercu_obsolete');
   saved.replaceChildren();saved.append(avisElement('p','Expéditeur : '+preview.from,'avis-texte'));avisApercu(saved,preview.message);saved.querySelector('.avis-preview-state').textContent='Aperçu exact, non envoyé';resultat.replaceChildren();
   var internal=/^[^\s@]+@yooza\.be$/i.test(preview.message.to),configured=preview.configured===true;
   if(!configured)avisErreur(resultat,new Error('envoi_a_configurer'));if(!internal)avisErreur(resultat,new Error('destinataire_pilote_uniquement'));
   var checkbox=avisCase(resultat,'Je confirme l’envoi de ce message à '+preview.message.to+'.',false);checkbox.parentNode.classList.add('avis-send-confirmation');checkbox.disabled=!configured||!internal||sendLocked;
   var envoyer=avisAction(resultat,'Envoyer cet e-mail',async function(){if(busy||sendLocked||!checkbox.checked||!configured||!internal||generation!==Avis.routeGeneration)return;busy=true;sendLocked=true;envoyer.disabled=checkbox.disabled=bouton.disabled=true;envoyer.textContent='Envoi et vérification…';
    try{var tentative=await avisApi('/avis/imports/'+encodeURIComponent(bon.id)+'/envoi',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:preview.revision,fingerprint:preview.fingerprint,confirmSend:true})});if(generation===Avis.routeGeneration)etat(tentative);}
    catch(error){if(generation===Avis.routeGeneration){resultat.replaceChildren();avisErreur(resultat,error);resultat.append(avisElement('p','Le résultat doit être vérifié avant toute reprise. Aucun nouvel envoi automatique.','avis-texte'));bouton.hidden=true;avisAction(resultat,'Vérifier l’état de l’envoi',function(){void apercu();},'clock','btn-ghost');}}
    finally{busy=false;}
   },'mail');envoyer.disabled=true;checkbox.addEventListener('change',function(){envoyer.disabled=busy||sendLocked||!checkbox.checked||!configured||!internal;});
   if(sendLocked)resultat.append(avisElement('p','Une tentative a déjà été lancée depuis cette fiche. Rechargez le bon pour vérifier la situation.','avis-texte'));
  }catch(error){if(generation===Avis.routeGeneration){resultat.replaceChildren();avisErreur(resultat,error);if(sendLocked)avisAction(resultat,'Actualiser l’état',function(){void apercu();},'clock','btn-ghost');}}
  finally{busy=false;if(generation===Avis.routeGeneration)bouton.disabled=false;}
 }
 var connue=bon.preparation?.sendAttempt;if(connue)etat({state:connue.state,verification:connue.verified===true?'verified':'unverified',envoiEffectue:connue.state==='sent'?true:connue.state==='failed'?false:null});
 return zone;
}

avisFiche=async function(parent,id,generation){
 var holder=avisElement('div');await avisFicheInitiale(holder,id,generation);if(generation!==Avis.routeGeneration)return;var bon=Avis.ficheCourante;if(!bon)return;var l=avisLecture(bon),d=l.details||{},oldGrid=holder.querySelector('.avis-grille');if(!oldGrid)return;var sections=Array.from(oldGrid.firstChild.children),pdf=oldGrid.lastChild.firstChild;parent.replaceChildren();
 avisLien(parent,'Tous les bons','#/clients','back','avis-back');
 var hero=avisElement('header',undefined,'avis-detail-heading'),text=avisElement('div');text.append(avisElement('h2',avisNom(bon)));var number=avisElement('span','Bon '+(l.numeroBon||'sans numéro confirmé'),'avis-document-number');text.append(number);var meta=avisElement('p',undefined,'avis-detail-meta');[avisDate(l.dateBon),l.responsable||'Responsable à préciser','Révision '+bon.revision].forEach(function(x){meta.append(avisElement('span',x));});text.append(meta);hero.append(text);var acts=avisElement('div',undefined,'avis-detail-actions');acts.append(avisBadge(bon));var primary=avisAction(acts,bon.preparation?'Voir le brouillon':'Vérifier l’intervention',function(){activer(bon.preparation?2:1,true);},bon.preparation?'mail':'check');hero.append(acts);parent.append(hero);
 var steps=avisElement('div',undefined,'avis-steps');[['Bon conservé',true],['Vérification enregistrée',Boolean(bon.validation)],['Demande préparée',Boolean(bon.preparation)]].forEach(function(v,i){var e=avisElement('div',undefined,v[1]?'is-done':'');e.append(avisElement('span',String(i+1)),avisElement('p',v[0]));steps.append(e);});parent.append(steps);
 var grid=avisElement('div',undefined,'avis-detail-grid'),main=avisElement('div',undefined,'avis-detail-main'),aside=avisElement('aside',undefined,'avis-pdf-aside');grid.append(main,aside);parent.append(grid);
 var tabs=avisElement('div',undefined,'avis-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Étapes du bon');main.append(tabs);var panels=[],buttons=[];
 [['Vue d’ensemble','file'],['Vérification','check'],['Demande d’avis','mail'],['Historique','clock']].forEach(function(v,i){var b=avisAction(tabs,v[0],function(){activer(i,false);},v[1],'avis-tab');b.setAttribute('role','tab');b.id='avis-tab-'+i;b.dataset.avisTab=String(i);b.setAttribute('aria-controls','avis-panel-'+i);var p=avisElement('div',undefined,'avis-tab-panel');p.id='avis-panel-'+i;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);panels.push(p);buttons.push(b);main.append(p);});
 function activer(index,focus){Avis.onglets[id]=index;panels.forEach(function(p,i){p.hidden=i!==index;buttons[i].setAttribute('aria-selected',String(i===index));buttons[i].tabIndex=i===index?0:-1;buttons[i].classList.toggle('is-active',i===index);});if(focus){buttons[index].focus();if(innerWidth<900)tabs.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}}
 tabs.addEventListener('keydown',function(e){var i=buttons.indexOf(document.activeElement);if(i<0)return;var next=e.key==='ArrowRight'?(i+1)%4:e.key==='ArrowLeft'?(i+3)%4:e.key==='Home'?0:e.key==='End'?3:null;if(next!==null){e.preventDefault();activer(next,false);buttons[next].focus();}});
 panels[0].append(sections[1],sections[2],sections[3]);panels[1].append(sections[4]);panels[2].append(sections[5]);panels[3].append(sections[6]);
 var parties=sections[1].querySelector('details');if(parties){parties.open=true;parties.classList.add('avis-document-facts');}sections[1].querySelector('h2').textContent='Client et adresses du document';sections[2].querySelector('h2').textContent='Les travaux relevés';sections[3].querySelector('h2').textContent='Remarques et suites à prévoir';
 var alertes=d.couverture?.alertes||[];if(alertes.length){var info=avisElement('details',undefined,'avis-reading-notes');info.append(avisElement('summary',alertes.length+' point'+(alertes.length>1?'s':'')+' de lecture à contrôler'),avisElement('p',alertes.map(function(x){return avisAlertes[x]||x.replaceAll('_',' ');}).join(' · ')));panels[0].prepend(info);}
 var form=sections[4].querySelector('form'),cases=form.querySelectorAll('.avis-case'),end=form.querySelector('input[type=datetime-local]');sections[4].querySelector('h2').textContent='Vérifier l’intervention';form.prepend(avisElement('h3','Coordonnées du client','avis-form-heading'));if(cases[0])form.insertBefore(avisElement('h3','État des travaux','avis-form-heading'),cases[0]);
 if(end&&cases[0]){var completed=cases[0].querySelector('input');function fin(){end.disabled=!completed.checked;end.required=completed.checked;}completed.addEventListener('change',fin);fin();}
 if(!d.suivisAPrevoir?.length&&cases[1])cases[1].hidden=true;
 var save=form.querySelector('button[type=submit]'),footer=avisElement('div',undefined,'avis-form-footer');footer.append(avisElement('span','La vérification est conservée avec ce bon.'),save);form.append(footer);save.prepend(avisIcone('check'));
 var prep=sections[5],prepButton=prep.querySelector('button');prep.querySelector('h2').textContent=bon.preparation?'Votre demande d’avis':'Préparer le retour du client';prepButton.prepend(avisIcone('mail'));prepButton.addEventListener('click',function(){Avis.onglets[id]=2;});if(prepButton.disabled&&!bon.preparation?.sendAttempt){var guide=avisElement('div',undefined,'avis-prep-guide');guide.append(avisIcone('check'),avisElement('h3','Une vérification avant la demande'),avisElement('p','Confirmez la fin des travaux et les coordonnées du destinataire pour préparer le message.'));avisAction(guide,'Vérifier l’intervention',function(){activer(1,true);},'arrow','btn-secondary');prep.append(guide);}
 var pdfWrap=avisElement('details',undefined,'avis-pdf');pdfWrap.open=innerWidth>=900;var summary=avisElement('summary','Le document original');summary.prepend(avisIcone('file'));pdfWrap.append(summary,pdf);aside.append(pdfWrap);pdf.querySelector('h2').remove();var facts=avisElement('p',(bon.extraction.pages||'?')+' page'+(bon.extraction.pages>1?'s':'')+' · '+Math.ceil((bon.extraction.taille||0)/1024)+' Ko · '+(bon.fichiers?.length||1)+' version'+(bon.fichiers?.length>1?'s':''),'avis-pdf-facts');pdf.prepend(facts);pdf.querySelector('a').classList.add('avis-lien');pdf.querySelector('a').prepend(avisIcone('file'));pdf.querySelector('a').textContent='Ouvrir le PDF original';pdf.querySelector('a').prepend(avisIcone('file'));
 activer(Avis.onglets[id]||0,false);
};

avisApercu=function(parent,m){
 var layout=avisElement('div',undefined,'avis-preview-layout'),message=avisElement('div',undefined,'avis-message');layout.append(message);parent.append(layout);var h=avisElement('header');h.append(avisElement('strong','Brouillon e-mail'),avisElement('span','Brouillon conservé','avis-preview-state'));message.append(h);
 [['À',m.to],['Objet',m.subject]].forEach(function(v){var r=avisElement('div',undefined,'avis-message-field');r.append(avisElement('span',v[0]),avisElement('strong',v[1]));message.append(r);});message.append(avisElement('pre',m.body,'avis-message-body'));
 avisAction(message,'Télécharger le brouillon e-mail',function(){var subject=btoa(String.fromCharCode.apply(null,new TextEncoder().encode(m.subject))),eml='X-Unsent: 1\r\nTo: '+m.to+'\r\nSubject: =?UTF-8?B?'+subject+'?=\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n'+m.body.replace(/\r?\n/g,'\r\n');var url=URL.createObjectURL(new Blob([eml],{type:'message/rfc822'})),a=avisElement('a');a.href=url;a.download='Yooza-demande-avis-brouillon.eml';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);},'download','btn-secondary');
 var qr=avisElement('aside',undefined,'avis-preview-qr');layout.append(qr);avisAfficherQr(qr,avisLienMessageQr(m.body));
};

avisReglages=async function(parent,generation){
 var holder=avisElement('div');await avisReglagesInitiaux(holder);if(generation!==Avis.routeGeneration)return;parent.replaceChildren();avisEntete(parent,'VOTRE IDENTITÉ YOOZA','Le retour client, à votre image.','Un lien direct, un QR code et un message clair pour vos clients.');var grid=avisElement('div',undefined,'avis-settings-grid'),main=avisElement('div'),aside=avisElement('aside');grid.append(main,aside);parent.append(grid);var c=holder.firstChild;main.append(c);c.querySelector('h2').textContent='Votre lien d’avis Google';var form=c.querySelector('form'),input=form.querySelector('input');input.placeholder='https://g.page/r/…/review';form.querySelector('button').prepend(avisIcone('check'));
 var zone=form.nextElementSibling;if(zone){var qrCard=avisElement('section',undefined,'avis-brand-qr');var logo=avisElement('img');logo.src='assets/yooza-logo-anthracite.png';logo.alt='Yooza';qrCard.append(logo,avisElement('h3','Votre expérience compte.'),avisElement('p','Partagez votre retour avec Yooza.'));qrCard.append(zone);aside.append(qrCard);}
 var usage=avisPanneau(main,'Un geste simple, après l’intervention');[['file','Sur papier','Téléchargez le QR pour une carte, un bon remis au client ou un support imprimé.'],['mail','Par e-mail','Le lien cliquable reste le plus pratique sur le téléphone du client.'],['check','Au bon moment','Vérifiez la fin des travaux avant de préparer votre demande.']].forEach(function(v){var row=avisElement('div',undefined,'avis-usage');row.append(avisIcone(v[0]));var text=avisElement('div');text.append(avisElement('h4',v[1]),avisElement('p',v[2]));row.append(text);usage.append(row);});
 var capabilities=avisPanneau(main,'Votre espace aujourd’hui');[['Import PDF','Disponible'],['Vérification et brouillons','Disponibles'],['Import Gmail','Sur demande'],['Contacts Teamleader','Recherche et choix'],['Envoi confirmé','Pilote vers @yooza.be']].forEach(function(v){var row=avisElement('div',undefined,'avis-capability');row.append(avisElement('span',v[0]),avisElement('strong',v[1],'is-available'));capabilities.append(row);});
};

/* QR local : encode uniquement le lien public, sans service tiers. */
function avisLienQr(value){
 try{if(typeof value!=='string'||value.length>2048)return null;var u=new URL(value);return u.protocol==='https:'&&['g.page','search.google.com','www.google.com','maps.google.com'].includes(u.hostname)&&!u.username&&!u.password?u.href:null;}catch(e){return null;}
}
function avisLienMessageQr(body){
 return String(body||'').split(/\s+/).map(avisLienQr).find(Boolean)||null;
}
function avisCreerQrCanvas(value){
 var url=avisLienQr(value);if(!url)throw Error('lien_avis_invalide');
 var qr=qrcode(0,'Q');qr.addData(url,'Byte');qr.make();
 var nombre=qr.getModuleCount(),marge=4,echelle=16,canvas=document.createElement('canvas');
 canvas.width=canvas.height=(nombre+marge*2)*echelle;
 canvas.setAttribute('role','img');canvas.setAttribute('aria-label','QR code du lien Google pour laisser un avis');
 var ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#000';
 for(var y=0;y<nombre;y++)for(var x=0;x<nombre;x++)if(qr.isDark(y,x))ctx.fillRect((x+marge)*echelle,(y+marge)*echelle,echelle,echelle);
 return canvas;
}
function avisAfficherQr(parent,value){
 var url=avisLienQr(value);if(!url)return;
 var figure=avisElement('figure',undefined,'avis-qr');parent.append(figure);
 try{
  var canvas=avisCreerQrCanvas(url);figure.append(canvas,avisElement('figcaption','Scannez pour partager votre expérience avec Yooza.'));
  var lien=avisElement('a','Ouvrir le lien d’avis Google');lien.href=url;lien.target='_blank';lien.rel='noopener';figure.append(lien);
  figure.append(avisElement('p','Sur papier : conservez le fond blanc et les marges, sans ajouter de logo au centre.','avis-texte'));
  var bouton=avisBouton(figure,'Télécharger le QR code',function(){
   canvas.toBlob(function(blob){if(!blob){avisErreur(figure,new Error('qr_indisponible'));return;}var source=URL.createObjectURL(blob),a=avisElement('a');a.href=source;a.download='Yooza-Avis-QR.png';a.click();setTimeout(function(){URL.revokeObjectURL(source);},1000);},'image/png');
  });bouton.classList.add('avis-qr-download');
 }catch(e){figure.append(avisElement('p','QR code indisponible pour ce lien. Le lien cliquable reste utilisable.','avis-erreur'));}
}

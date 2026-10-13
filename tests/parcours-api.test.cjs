const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'../yooza-avis/js/parcours.js'),'utf8');
function contexte(fetch){const c={fetch,console,handleRoute:()=>{},window:{},URL,Blob,TextEncoder};vm.createContext(c);vm.runInContext(script,c);c.Avis.config={apiBase:'/api/v1'};c.Avis.mode='google';return c;}
test('le parcours envoie son identité en mémoire et ne transforme pas une erreur en succès',async()=>{
 let requete;const c=contexte(async(u,o)=>{requete={u,o};return {ok:false,status:403,json:async()=>({error:{code:'forbidden'}})};});
 c.Avis.jeton='jeton-fictif';await assert.rejects(c.avisApi('/avis/imports'),/forbidden/);
 assert.equal(requete.o.headers.Authorization,'Bearer jeton-fictif');assert.equal(requete.o.cache,'no-store');assert.equal(requete.u,'/api/v1/avis/imports');
});
test('une identité expirée est effacée et déclenche le retour à la connexion',async()=>{
 const c=contexte(async()=>({ok:false,status:401,json:async()=>({error:{code:'unauthenticated'}})}));let renders=0;c.handleRoute=()=>renders++;c.Avis.jeton='expire';
 await assert.rejects(c.avisApi('/avis/imports'),/unauthenticated/);assert.equal(c.Avis.jeton,null);assert.equal(renders,1);
});
test('l’import garde les octets du PDF et la demande explicite de l’utilisateur',async()=>{
 const c=contexte(async(_u,o)=>{assert.equal(o.body,'octets');assert.equal(o.headers['Content-Type'],'application/pdf');assert.equal(o.headers['X-Yooza-Import'],'manuel');return {ok:true,status:200,json:async()=>({data:{outcome:'importe'}})};});
 assert.equal((await c.avisApi('/avis/imports',{method:'POST',headers:{'Content-Type':'application/pdf'},body:'octets'})).outcome,'importe');
});

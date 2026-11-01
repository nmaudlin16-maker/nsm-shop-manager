'use strict';
const PROJECT='https://kjooizmwkvqqacbfeqha.supabase.co';
const authorizationId=new URL(location.href).searchParams.get('authorization_id');
const $=id=>document.getElementById(id);
let client=null;
let busy=false;
const memory={};
const storage={getItem:k=>memory[k]??null,setItem:(k,v)=>{memory[k]=v},removeItem:k=>{delete memory[k]}};
function status(message){$('status').textContent=message}
function show(id){$('signin').classList.toggle('hidden',id!=='signin');$('consent').classList.toggle('hidden',id!=='consent')}
function lock(value){busy=value;for(const id of ['approve','deny'])$(id).disabled=value}
function errorMessage(error){return error?.message||String(error)}
async function loadDetails(){
 const {data,error}=await client.auth.oauth.getAuthorizationDetails(authorizationId);
 if(error)throw error;
 if(!data)throw Error('No authorization details were returned.');
 if(!('authorization_id' in data)){
   if(!data.redirect_url)throw Error('Missing authorization redirect.');
   location.assign(data.redirect_url);return;
 }
 $('client').textContent=data.client?.name||'Unnamed application';
 $('redirect').textContent=data.redirect_uri||'Not provided';
 $('scopes').textContent=data.scope||'email (default)';
 show('consent');
 status('Review the application and choose whether to grant access.');
}
$('login').addEventListener('submit',async event=>{
 event.preventDefault();
 if(busy)return;
 busy=true;
 const button=$('login').querySelector('button');
 button.disabled=true;
 try{
   const key=$('key').value.trim();
   if(!key.startsWith('sb_publishable_'))throw Error('Enter your Supabase publishable key (not a secret key).');
   client=window.supabase.createClient(PROJECT,key,{auth:{storage,autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
   status('Signing in to Supabase…');
   const {error}=await client.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
   $('password').value='';
   if(error)throw error;
   await loadDetails();
 }catch(error){status('Unable to authorize: '+errorMessage(error));}
 finally{busy=false;button.disabled=false}
});
async function decide(approve){
 if(busy||!client)return;
 lock(true);
 try{
   status(approve?'Approving connection with Supabase…':'Denying connection…');
   const result=approve?await client.auth.oauth.approveAuthorization(authorizationId):await client.auth.oauth.denyAuthorization(authorizationId);
   if(result.error)throw result.error;
   if(!result.data?.redirect_url)throw Error('Supabase did not return a redirect URL.');
   location.assign(result.data.redirect_url);
 }catch(error){status('Authorization failed: '+errorMessage(error));lock(false)}
}
$('approve').addEventListener('click',()=>decide(true));
$('deny').addEventListener('click',()=>decide(false));
if(!authorizationId||!/^[a-zA-Z0-9_-]{8,256}$/.test(authorizationId)){
 status('Invalid or missing authorization_id. Start the connection from ChatGPT.');
}else if(!window.supabase?.createClient){
 status('Could not load the Supabase authentication library. Please reload the page.');
}else{
 show('signin');
 status('Sign in to review the authorization request.');
}

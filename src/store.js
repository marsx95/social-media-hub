import { seedTasks, validateTask, MEMBERS } from './model.js';
import { firebaseConfig, workspaceId, firebaseSdkVersion } from './config.js';
const KEY='social-media-hub:v1';
const CONTACTS_KEY='social-media-hub:contacts';
const PEOPLE=['amar','nduy','arin','aldyan'];
export class Store {
  constructor() {this.tasks=[];this.mode=firebaseConfig?'cloud':'local';this.actor='amar';this.listener=()=>{};this.errorListener=()=>{};this.ready=false;this.unsub=null;this.contacts={};this.onSaved=null;}
  emit() {this.listener();}
  async init(listener,onError) {
    this.listener=listener; this.errorListener=onError;
    if (this.mode==='local') {
      const raw=localStorage.getItem(KEY);
      if(raw) {const parsed=JSON.parse(raw);if(!Array.isArray(parsed))throw Error('Data lokal tidak valid.');this.tasks=parsed.map(validateTask);}
      else {this.tasks=seedTasks();localStorage.setItem(KEY,JSON.stringify(this.tasks));}
      try{this.contacts=JSON.parse(localStorage.getItem(CONTACTS_KEY)||'{}');}catch{this.contacts={};}
      this.ready=true;
      addEventListener('storage',e=>{if(e.key===KEY){try{this.tasks=JSON.parse(e.newValue||'[]').map(validateTask);this.emit();}catch(error){onError(error.message);}}});
      this.emit();return;
    }
    const base=`https://www.gstatic.com/firebasejs/${firebaseSdkVersion}/`;
    const [app,auth,db]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
    this.authApi=auth;this.dbApi=db;const firebaseApp=app.initializeApp(firebaseConfig);
    this.auth=auth.getAuth(firebaseApp);this.db=db.getFirestore(firebaseApp);
    auth.onAuthStateChanged(this.auth,async user=>{
      this.unsub?.();this.tasks=[];this.user=user;this.ready=false;this.actor='';this.emit();
      if(!user)return;
      try {
        const member=await db.getDoc(db.doc(this.db,'workspaces',workspaceId,'members',user.uid));
        if(!member.exists()||!MEMBERS.some(m=>m.id===member.data().personId&&m.id!=='gpt')) throw Error('Akun ini belum terdaftar sebagai anggota. Minta Amar mendaftarkan UID di Firebase. UID: '+user.uid);
        this.actor=member.data().personId;
        this.unsubContacts?.();
        this.unsubContacts=db.onSnapshot(db.collection(this.db,'workspaces',workspaceId,'contacts'),snap=>{this.contacts=Object.fromEntries(snap.docs.map(d=>[d.id,d.data().email||'']));this.emit();},()=>{});
        this.unsub=db.onSnapshot(db.collection(this.db,'workspaces',workspaceId,'tasks'),snapshot=>{
          try{this.tasks=snapshot.docs.map(d=>validateTask({...d.data(),id:d.id}));this.ready=true;this.emit();}catch(error){onError(error.message);}
        },error=>onError('Akses database gagal: '+error.message));
      }catch(error){onError(error.message);}
    });
  }
  async signIn() {await this.authApi.signInWithPopup(this.auth,new this.authApi.GoogleAuthProvider());}
  async signOut() {await this.authApi.signOut(this.auth);}
  async save(task,isNew=false) {
    validateTask(task);
    if(!this.ready)throw Error('Penyimpanan belum siap.');
    const prev=isNew?null:this.tasks.find(t=>t.id===task.id)||null;
    if(this.mode==='local') {
      const current=JSON.parse(localStorage.getItem(KEY)||'[]');
      const index=current.findIndex(t=>t.id===task.id);
      if(isNew&&index>=0)throw Error('ID pekerjaan sudah ada.');
      if(!isNew&&(index<0||current[index].revision!==task.revision-1))throw Error('Pekerjaan telah diperbarui di tab lain. Tutup detail dan buka kembali.');
      if(index<0)current.push(task);else current[index]=task;
      localStorage.setItem(KEY,JSON.stringify(current));this.tasks=current;this.emit();this.onSaved?.(prev,task);return;
    }
    const {doc,runTransaction}=this.dbApi;
    await runTransaction(this.db,async tx=>{
      const ref=doc(this.db,'workspaces',workspaceId,'tasks',task.id);const snapshot=await tx.get(ref);
      if(isNew&&snapshot.exists())throw Error('ID pekerjaan sudah ada.');
      if(!isNew&&(!snapshot.exists()||snapshot.data().revision!==task.revision-1))throw Error('Pekerjaan telah diperbarui anggota lain. Buka ulang detail.');
      tx.set(ref,task);
    });
    this.onSaved?.(prev,task);
    // Snapshot listeners supply authoritative shared state.
  }
  async deleteTask(id) {
    if(!this.ready)throw Error('Penyimpanan belum siap.');
    if(!PEOPLE.includes(this.actor))throw Error('Hanya anggota tim yang terdaftar yang dapat menghapus pekerjaan.');
    if(this.tasks.some(task=>task.id!==id&&task.dependencies.includes(id)))throw Error('Pekerjaan ini masih menjadi prasyarat pekerjaan lain. Hapus prasyarat tersebut terlebih dahulu.');
    if(this.mode==='local') {
      const current=JSON.parse(localStorage.getItem(KEY)||'[]');
      const next=current.filter(task=>task.id!==id);
      if(next.length===current.length)throw Error('Pekerjaan tidak ditemukan.');
      localStorage.setItem(KEY,JSON.stringify(next));this.tasks=next;this.emit();return;
    }
    const ref=this.dbApi.doc(this.db,'workspaces',workspaceId,'tasks',id);
    await this.dbApi.deleteDoc(ref);
  }
  async saveContact(personId,email) {
    if(!PEOPLE.includes(personId))throw Error('Anggota tidak dikenal.');
    email=String(email||'').trim();
    if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw Error('Format email tidak valid: '+email);
    if(this.mode==='local'){this.contacts={...this.contacts,[personId]:email};localStorage.setItem(CONTACTS_KEY,JSON.stringify(this.contacts));this.emit();return;}
    if(this.actor!=='amar')throw Error('Hanya Amar yang dapat mengubah email anggota.');
    await this.dbApi.setDoc(this.dbApi.doc(this.db,'workspaces',workspaceId,'contacts',personId),{email});
  }
  async seedCloud() {if(this.mode!=='cloud'||this.actor!=='amar'||this.tasks.length)throw Error('Workspace harus kosong dan diinisialisasi oleh Amar.');const hook=this.onSaved;this.onSaved=null;try{for(const task of seedTasks())await this.save(task,true);}finally{this.onSaved=hook;}}
  exportData() {return {schemaVersion:1,exportedAt:new Date().toISOString(),tasks:this.tasks};}
  async importData(data) {
    if(this.mode!=='local')throw Error('Impor cadangan tersedia di mode lokal.');
    if(data?.schemaVersion!==1||!Array.isArray(data.tasks)||data.tasks.length>3000)throw Error('Format cadangan tidak valid.');
    const tasks=data.tasks.map(validateTask);if(new Set(tasks.map(t=>t.id)).size!==tasks.length)throw Error('Ada ID duplikat.');
    const existing=JSON.parse(localStorage.getItem(KEY)||'[]');
    // Imports add missing IDs only; existing work and approvals are never overwritten.
    const fresh=tasks.filter(t=>!existing.some(x=>x.id===t.id));
    const merged=[...existing,...fresh];localStorage.setItem(KEY,JSON.stringify(merged));this.tasks=merged;this.emit();return fresh.length;
  }
}

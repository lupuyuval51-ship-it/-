import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword, id } from './security.js';
import { pathTemplates } from './catalog.js';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const dbPath=path.join(root,'data','db.json');
const now=()=>new Date().toISOString();
function base(){return {users:[],profiles:[],parental_consents:[],plans:[],plan_features:[],subscriptions:[],learning_paths:[],generated_paths:[],path_enrollments:[],chapters:[],lessons:[],tasks:[],task_submissions:[],ai_coach_messages:[],skills:[],user_skills:[],xp_events:[],achievements:[],user_achievements:[],streaks:[],friendships:[],challenges:[],challenge_participants:[],marketplace_paths:[],marketplace_sales:[],reviews:[],favorites:[],daily_games:[],daily_game_templates:[],daily_game_questions:[],daily_game_attempts:[],game_events:[],leaderboards:[],cosmetic_items:[],user_inventory:[],orders:[],payment_proofs:[],notifications:[],reports:[],admin_actions:[],password_resets:[],email_verifications:[]};}
function seed(db){
 if(db.users.length) return db;
 const adminId=id('usr'), demoId=id('usr'), basicId=id('usr');
 db.users.push(
  {id:adminId,email:'admin@levelup.local',passwordHash:hashPassword('Admin1234'),role:'admin',emailVerified:true,created_at:now(),updated_at:now()},
  {id:demoId,email:'demo@levelup.local',passwordHash:hashPassword('Demo1234'),role:'user',emailVerified:true,created_at:now(),updated_at:now()},
  {id:basicId,email:'basic@levelup.local',passwordHash:hashPassword('Basic1234'),role:'user',emailVerified:true,created_at:now(),updated_at:now()}
 );
 db.profiles.push(
  {userId:adminId,displayName:'מנהל LEVELUP',birthYear:1995,planId:'pro',xp:4200,coins:810,level:9,streak:12,privacy:'private',locale:'he',coachStyle:'professional',theme:'dark',created_at:now(),updated_at:now()},
  {userId:demoId,displayName:'נועם הדגמה',birthYear:2011,planId:'free',xp:680,coins:96,level:3,streak:4,privacy:'private',locale:'he',coachStyle:'energetic',theme:'dark',created_at:now(),updated_at:now()},
  {userId:basicId,displayName:'דנה Basic',birthYear:2007,planId:'basic',xp:1450,coins:220,level:5,streak:9,privacy:'private',locale:'he',coachStyle:'supportive',theme:'dark',created_at:now(),updated_at:now()}
 );
 const enrollId=id('enr'); const tpl=pathTemplates[0];
 db.path_enrollments.push({id:enrollId,userId:demoId,pathSlug:tpl.slug,progress:32,started_at:now(),targetDate:new Date(Date.now()+6*86400000).toISOString().slice(0,10),active:true,completedTaskIds:['html','nav'],created_at:now(),updated_at:now()});
 db.parental_consents.push({id:id('pc'),userId:demoId,guardianEmail:'parent.demo@levelup.local',status:'approved_demo',verified_at:now(),created_at:now(),updated_at:now()});
  db.xp_events.push({id:id('xp'),userId:demoId,amount:180,reason:'demo_seed',created_at:now()});
 db.achievements.push({id:'first-task',title:'הצעד הראשון',description:'השלמת משימה ראשונה'},{id:'streak-3',title:'רצף מתחיל',description:'שלושה ימי למידה רצופים'},{id:'game-first',title:'שחקן לומד',description:'סיום Daily 3D Quest'});
 db.user_achievements.push({id:id('ua'),userId:demoId,achievementId:'first-task',created_at:now()},{id:id('ua'),userId:demoId,achievementId:'streak-3',created_at:now()});
 for(const [i,p] of pathTemplates.entries()) db.marketplace_paths.push({id:id('mp'),pathSlug:p.slug,creatorId:adminId,title:p.title,description:p.description,category:p.category,difficulty:p.difficulty,durationDays:p.durationDays,price:i<5?0:[9,15,19][i-5]||0,rating:4.6-i*0.05,learners:120+i*37,status:'approved',updated_at:now(),created_at:now()});
 db.challenges.push({id:id('challenge'),creatorId:adminId,kind:'weekly',title:'משימת השבוע: 3 צעדים ברצף',description:'השלם שלוש משימות לימוד במהלך השבוע ושמור על רצף.',status:'active',starts_at:now(),ends_at:new Date(Date.now()+7*86400000).toISOString(),created_at:now(),updated_at:now()});
 return db;
}
export function load(){ let db; try{db=JSON.parse(fs.readFileSync(dbPath,'utf8'));}catch{db=base();} db={...base(),...db}; return seed(db); }
export function save(db){ fs.mkdirSync(path.dirname(dbPath),{recursive:true}); const tmp=dbPath+'.tmp'; fs.writeFileSync(tmp,JSON.stringify(db,null,2)); fs.renameSync(tmp,dbPath); }
export function mutate(fn){const db=load(); const out=fn(db); save(db); return out;}
export function reset(){const db=seed(base()); save(db); return db;}
export {dbPath, root};

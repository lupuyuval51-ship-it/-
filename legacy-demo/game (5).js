import crypto from 'node:crypto';
import { gameModes, worlds, pathTemplates } from './catalog.js';
import { id } from './security.js';
const dateLocal=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const hashInt=s=>parseInt(crypto.createHash('sha256').update(s).digest('hex').slice(0,8),16);
function allQuestions(){const q=[]; for(const p of pathTemplates) for(const c of p.chapters) for(const t of c.tasks) q.push({...t.quiz,taskId:t.id,topic:t.title,category:p.category}); return q;}
export function dailyFor(profile,enrollment,overrideMode){
 const date=dateLocal(), seed=hashInt(`${date}|${enrollment?.pathSlug||'general'}|${profile.level||1}`), mode=overrideMode||gameModes[seed%gameModes.length].id, world=worlds[(seed>>>3)%worlds.length].id;
 const category=enrollment&&(pathTemplates.find(p=>p.slug===enrollment.pathSlug)?.category||enrollment.category);
 const questions=allQuestions().filter(q=>!enrollment||category===q.category);
 const pool=(questions.length?questions:allQuestions()).sort((a,b)=>hashInt(`${seed}|${a.taskId}`)-hashInt(`${seed}|${b.taskId}`)).slice(0,5);
 return {dailyGameId:`daily_${date}_${mode}`,date,seed,version:1,gameMode:mode,worldTheme:world,difficulty:Math.max(1,Math.min(5,profile.level||1)),skillCategory:pool[0]?.category||'כללי',lessonTopics:pool.map(x=>x.topic),questions:pool.map((x,i)=>({id:`q${i+1}`,prompt:x.prompt,options:x.options,answerIndex:x.answerIndex,explanation:x.explanation,topic:x.topic})),obstacles:[{type:'gate',count:5},{type:'moving-block',count:3}],rewards:{xp:120,coins:20,perfectBonusXp:40},timeLimit:300,scoreRules:{correct:100,wrong:-20,streak:25,noHint:10},leaderboardGroup:`${date}_${profile.level||1}`,minimumPlan:'basic',isActive:true};
}
export function validateAttempt(attempt,game,payload){
 if(!attempt||attempt.finished_at) return {ok:false,error:'attempt_invalid'};
 const elapsed=Date.now()-new Date(attempt.started_at).getTime(); if(elapsed<1000||elapsed>game.timeLimit*1000+60000)return {ok:false,error:'time_invalid'};
 const answers=Array.isArray(payload.answers)?payload.answers:[]; if(answers.length!==game.questions.length)return {ok:false,error:'answers_invalid'};
 let score=0,correct=0,streak=0,bestStreak=0,hints=0;
 for(let i=0;i<answers.length;i++){const a=answers[i],q=game.questions[i]; if(a.questionId!==q.id||!Number.isInteger(a.answerIndex))return {ok:false,error:'sequence_invalid'}; if(a.usedHint)hints++; if(a.answerIndex===q.answerIndex){correct++;streak++;bestStreak=Math.max(bestStreak,streak);score+=game.scoreRules.correct+(streak>1?game.scoreRules.streak:0)+(a.usedHint?0:game.scoreRules.noHint);}else{streak=0;score+=game.scoreRules.wrong;}}
 score=Math.max(0,score); const perfect=correct===answers.length; const xp=game.rewards.xp+(perfect?game.rewards.perfectBonusXp:0); const coins=game.rewards.coins+(perfect?8:0);
 return {ok:true,score,correct,wrong:answers.length-correct,bestStreak,hints,xp,coins,elapsedMs:elapsed,topicsStrong:game.questions.filter((q,i)=>answers[i].answerIndex===q.answerIndex).map(q=>q.topic),topicsWeak:game.questions.filter((q,i)=>answers[i].answerIndex!==q.answerIndex).map(q=>q.topic)};
}
export const newAttemptId=()=>id('attempt');

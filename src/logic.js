export const addDays=(date,n)=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
export const dayDiff=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000);
export const weekStart=date=>addDays(date,-((new Date(date+'T12:00:00').getDay()+6)%7));
export const minutes=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
export const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export const terminal=t=>['Completed','Cancelled'].includes(t.status);
export function occurrences(state,date){return state.commitments.filter(c=>date>=c.startDate&&(!c.endDate||date<=c.endDate)&&(c.recurrence==='Daily'||String(new Date(date+'T12:00:00').getDay())===String(c.weekday))).flatMap(c=>{const ex=(c.exceptions||[]).find(e=>e.date===date);return ex?.cancelled?[]:[{...c,...ex,date,commitmentId:c.id}];});}
export function proposeSchedule(state,date,taskIds){
 const weekday=new Date(date+'T12:00:00').getDay();
 const busy=[...occurrences(state,date),...state.schedule.filter(b=>b.date===date)].map(b=>({start:minutes(b.start),end:minutes(b.end)}));
 const scheduled=[],unscheduled=[];let hours=0;
 const start=minutes(state.settings.workStart),end=minutes(state.settings.workEnd);
 const week=weekStart(date);const used=state.schedule.filter(b=>b.date>=week&&b.date<=addDays(week,6)&&state.tasks.find(t=>t.id===b.taskId)?.category==='Research').reduce((s,b)=>s+(minutes(b.end)-minutes(b.start))/60,0);
 const tasks=state.tasks.filter(t=>!terminal(t)&&(!taskIds||taskIds.includes(t.id))&&!state.schedule.some(b=>b.taskId===t.id)).sort((a,b)=>({High:0,Medium:1,Low:2}[a.priority]-{High:0,Medium:1,Low:2}[b.priority])||(a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
 for(const task of tasks){
 let reason='No available time block';const length=Math.round(Number(task.duration)*60);
 const deps=(task.dependencies||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(deps.some(id=>!state.tasks.some(t=>t.id===id&&t.status==='Completed'))){unscheduled.push({task,reason:'Dependency not completed'});continue;}
 if(task.category==='Research'&&(!state.settings.researchDays.split(',').includes(String(weekday))||used+hours+length/60>Number(state.settings.weeklyHours)||(weekday===6&&hours+length/60>Number(state.settings.saturdayHours)))){unscheduled.push({task,reason:'Research availability or hour budget exceeded'});continue;}
 let found=false;
 for(let at=start;at+length<=end;at+=15){if(busy.every(b=>at+length<=b.start||at>=b.end)){scheduled.push({taskId:task.id,title:task.title,date,start:clock(at),end:clock(at+length)});busy.push({start:at,end:at+length+Number(state.settings.breakMinutes)});if(task.category==='Research')hours+=length/60;found=true;break;}}
 if(!found)unscheduled.push({task,reason});
 }
 return {scheduled,unscheduled};
}
export function proposeWeek(state,date,taskIds){
 const start=weekStart(date);let working={...state,schedule:[...state.schedule]};const scheduled=[];let remaining=[];
 for(let i=0;i<7;i++){const result=proposeSchedule(working,addDays(start,i),taskIds);scheduled.push(...result.scheduled);working={...working,schedule:[...working.schedule,...result.scheduled]};remaining=result.unscheduled;}
 return {scheduled,unscheduled:remaining};
}
export function validateData(d){
 if(!d||d.version!==1)throw Error('Unsupported data version. Import a Research Compass version 1 export.');
 const collections=['goals','projects','milestones','tasks','weeklyGoals','dailyGoals','progress','sessions','reviews','revisions','messages','schedule','artifacts','commitments'];
 for(const key of collections){if(!Array.isArray(d[key]))throw Error(`Missing collection: ${key}`);const ids=new Set();for(const row of d[key]){if(!row||typeof row.id!=='string'||ids.has(row.id))throw Error(`Invalid or duplicate identifier in ${key}`);ids.add(row.id);for(const [field,value]of Object.entries(row)){if(/^(date|dueDate|targetDate|originalTargetDate|completedDate|startDate|endDate|week)$/.test(field)&&value&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(Date.parse(value))))throw Error(`Invalid date in ${key}`);}if(['tasks','sessions'].includes(key)&&(!Number.isFinite(Number(row.duration))||Number(row.duration)<=0))throw Error(`Invalid duration in ${key}`);}}
 for(const key of collections)for(const row of d[key]){
  for(const field of ['title','description','status','category','priority','stage','dependencies','notes','body','researchDays','accomplishments','findings','blockers','nextActions','artifact','objective','areas','resources','criteria'])if(row[field]!==undefined&&typeof row[field]!=='string')throw Error(`Invalid ${field} in ${key}`);
  for(const field of ['start','end'])if(row[field]&&(!/^([01]\d|2[0-3]):[0-5]\d$/.test(row[field])))throw Error(`Invalid time in ${key}`);
  if(row.start&&row.end&&row.start>=row.end)throw Error(`Invalid time range in ${key}`);
  if(key==='commitments'&&row.exceptions!==undefined&&!Array.isArray(row.exceptions))throw Error('Invalid recurrence exceptions');
  if(key==='messages'&&row.changes!==undefined&&(!Array.isArray(row.changes)||row.changes.some(c=>!collections.includes(c.collection)||!c.data||typeof c.data.id!=='string')))throw Error('Invalid assistant proposal');
 }
 for(const key of ['weeklyHours','saturdayHours','defaultDuration','breakMinutes','microgoalCount','taskCount'])if(!Number.isFinite(Number(d.settings?.[key]))||Number(d.settings[key])<0)throw Error(`Invalid setting: ${key}`);
 if(!/^[0-6](,[0-6])*$/.test(d.settings?.researchDays)||!/^\d{4}-\d{2}-\d{2}$/.test(d.settings?.demoDate))throw Error('Invalid planning preferences');
 if(!d.settings||!Number.isFinite(Number(d.settings.weeklyHours))||d.settings.weeklyHours<=0||!/^\d\d:\d\d$/.test(d.settings.workStart)||!/^\d\d:\d\d$/.test(d.settings.workEnd)||minutes(d.settings.workStart)>=minutes(d.settings.workEnd))throw Error('Invalid application settings');
 for(const key of ['projects','milestones','tasks','progress','sessions','weeklyGoals'])for(const row of d[key]){if(row.projectId&&!d.projects.some(p=>p.id===row.projectId))throw Error(`Unknown project in ${key}`);if(row.goalId&&!d.goals.some(g=>g.id===row.goalId))throw Error(`Unknown goal in ${key}`);}
 return d;
}
export function reducer(s,a){if(a.type==='replace')return a.data;if(a.type==='settings')return {...s,settings:{...s.settings,...a.data}};if(a.type==='timer')return {...s,timer:a.data};if(a.type==='batch')return a.actions.reduce(reducer,s);if(a.type==='save'){const previous=s[a.collection].find(x=>x.id===a.data.id);let row={...previous,...a.data};if(a.collection==='milestones')row.originalTargetDate=previous?.originalTargetDate||previous?.targetDate||row.targetDate;return {...s,[a.collection]:previous?s[a.collection].map(x=>x.id===row.id?row:x):[...s[a.collection],row]};}if(a.type==='delete'){return {...s,[a.collection]:s[a.collection].filter(x=>x.id!==a.id),...(a.collection==='tasks'?{schedule:s.schedule.filter(b=>b.taskId!==a.id)}:{})};}return s;}

import test from 'node:test';
import assert from 'node:assert/strict';
import {seed} from '../src/data.js';
import {proposeSchedule,validateData,reducer,occurrences,weekStart} from '../src/logic.js';
test('initial completion is explicit, with unknown dates preserved',()=>{const s=seed();assert.equal(s.milestones.filter(m=>m.status==='Completed').length,4);assert.equal(s.milestones.find(m=>m.id==='m3').completedDate,'');assert.equal(s.projects.filter(p=>p.stage==='Submitted').length,0);assert.equal(validateData(s),s);});
test('scheduler respects commitments, non-overlap, and dependency readiness',()=>{const s=seed();s.tasks[0].dependencies='t2';const p=proposeSchedule(s,'2026-11-24');assert.equal(p.unscheduled[0].reason,'Dependency not completed');for(const b of p.scheduled){assert.ok(b.end<='10:00'||b.start>='13:00');for(const other of p.scheduled.filter(x=>x.taskId!==b.taskId))assert.ok(b.end<=other.start||b.start>=other.end);}});
test('research budgets leave excess work unscheduled',()=>{const s=seed();s.settings.weeklyHours=1;const p=proposeSchedule(s,'2026-11-24');assert.equal(p.scheduled.length,1);assert.equal(p.unscheduled.length,3);});
test('cancelled occurrence does not change recurring series',()=>{const s=seed();s.commitments[0].exceptions=[{date:'2026-11-24',cancelled:true}];assert.equal(occurrences(s,'2026-11-24').length,1);assert.equal(occurrences(s,'2026-12-01').length,2);});
test('milestone revisions preserve original deadline and unrelated work',()=>{let s=seed();s=reducer(s,{type:'save',collection:'milestones',data:{id:'m5',targetDate:'2026-12-01'}});assert.equal(s.milestones.find(m=>m.id==='m5').originalTargetDate,'2026-11-14');assert.equal(s.tasks.length,4);});
test('import rejects invalid versions, collections, relationships, durations',()=>{for(const mutate of [s=>s.version=2,s=>s.tasks=null,s=>s.projects[0].goalId='missing',s=>s.tasks[0].duration=-1,s=>s.tasks.push(s.tasks[0])]){const s=seed();mutate(s);assert.throws(()=>validateData(s));}});
test('Monday weeks cross calendar boundaries',()=>assert.equal(weekStart('2027-01-03'),'2026-12-28'));

test('weekly scheduler distributes work across days without exceeding weekly hours',async()=>{const {proposeWeek}=await import('../src/logic.js');const s=seed();s.settings.workEnd='10:00';s.tasks.forEach(t=>t.duration=2);s.settings.weeklyHours=6;const p=proposeWeek(s,'2026-11-24');assert.equal(p.scheduled.length,3);assert.equal(new Set(p.scheduled.map(b=>b.date)).size,3);assert.equal(p.unscheduled.length,1);});
test('import rejects malformed UI fields',()=>{const s=seed();s.tasks[0].title={bad:true};assert.throws(()=>validateData(s));});

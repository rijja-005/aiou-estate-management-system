import 'dotenv/config';
import { describe,expect,it } from 'vitest';
import { prisma } from '../db/prisma';
import { runDailyNotifications } from '../jobs/service';
import { globalSearch } from '../search/service';
import { createAndRunReport } from './service';
const run=process.env.RUN_DATABASE_TESTS==='true';
describe.skipIf(!run)('reporting and scheduled jobs',()=>{it('generates downloadable reports, searches, and runs idempotently',async()=>{
 const actor=await prisma.user.findUnique({where:{email:process.env.SEED_SUPERADMIN_EMAIL??''}});if(!actor)throw new Error('Seeded admin required');
 const day=new Date().toISOString().slice(0,10),key=`daily-notifications:${day}`;let jobId='';
 try{const job=await createAndRunReport('properties','csv',actor.id);jobId=job.id;expect(job.status).toBe('COMPLETED');expect(typeof job.resultData).toBe('string');expect(job.rowCount).toBeGreaterThanOrEqual(0);expect(await globalSearch('definitely-no-match-phase10')).toEqual([]);const first=await runDailyNotifications();const second=await runDailyNotifications();expect(first.alreadyRan).toBe(false);expect(second.alreadyRan).toBe(true);}
 finally{if(jobId)await prisma.reportJob.delete({where:{id:jobId}});await prisma.scheduledJobRun.deleteMany({where:{idempotencyKey:key}});}
});});

import { Prisma } from '../../../node_modules/.prisma/client';
import { prisma } from '../db/prisma';

export const REPORT_TYPES = ['properties','bookings','office-allocations','shops-finance','flats','audit'] as const;
export type ReportType = typeof REPORT_TYPES[number];
export function csvCell(value: unknown): string { const text=value instanceof Date?value.toISOString():value==null?'':String(value); return /[",\n\r]/.test(text)?`"${text.replaceAll('"','""')}"`:text; }
export function toCsv(rows:Record<string,unknown>[]):string { if(!rows.length)return ''; const headers=Object.keys(rows[0]); return `${headers.map(csvCell).join(',')}\n${rows.map(row=>headers.map(key=>csvCell(row[key])).join(',')).join('\n')}\n`; }

export async function reportRows(type:ReportType):Promise<Record<string,unknown>[]> {
  if(type==='properties') return (await prisma.property.findMany({where:{deletedAt:null},include:{building:true,floor:true,propertyType:true},orderBy:{propertyCode:'asc'}})).map(x=>({code:x.propertyCode,name:x.displayName,building:x.building.name,floor:x.floor.name,type:x.propertyType.name,operational:x.operationalStatus,availability:x.availabilityStatus,occupancy:x.occupancyStatus,paid:x.isPaid}));
  if(type==='bookings') return (await prisma.booking.findMany({include:{resources:{include:{property:true}}},orderBy:{createdAt:'desc'}})).map(x=>({reference:x.referenceNumber,properties:x.resources.map(r=>r.property.propertyCode).join('; '),requester:x.requesterName,status:x.status,start:x.startAt,end:x.endAt,purpose:x.purpose}));
  if(type==='office-allocations') return (await prisma.allocation.findMany({include:{property:true,department:true},orderBy:{createdAt:'desc'}})).map(x=>({reference:x.referenceNumber,property:x.property.propertyCode,department:x.department.name,responsible:x.responsiblePerson,status:x.status,start:x.startDate,end:x.endDate}));
  if(type==='shops-finance') return (await prisma.bill.findMany({include:{agreement:{include:{tenant:true,property:true}}},orderBy:{issueDate:'desc'}})).map(x=>({bill:x.billNumber,tenant:x.agreement.tenant.name,property:x.agreement.property.propertyCode,status:x.status,total:x.totalAmount,balance:x.balanceAmount,due:x.dueDate}));
  if(type==='flats') return (await prisma.flatAllocation.findMany({include:{property:true,employee:{include:{grade:true}}},orderBy:{createdAt:'desc'}})).map(x=>({reference:x.referenceNumber,property:x.property.propertyCode,employeeNumber:x.employee.employeeNumber,employee:x.employee.name,grade:x.employee.grade.code,status:x.status,vacationDue:x.expectedVacationDate}));
  return (await prisma.auditLog.findMany({include:{actor:{select:{displayName:true,email:true}}},orderBy:{createdAt:'desc'},take:10000})).map(x=>({time:x.createdAt,action:x.action,entityType:x.entityType,entityId:x.entityId,actor:x.actor?.displayName??'System',actorEmail:x.actor?.email??'',requestId:x.requestId??''}));
}

export async function createAndRunReport(type:ReportType,format:'csv'|'json',userId:string){
  const job=await prisma.reportJob.create({data:{reportType:type,format,requestedBy:userId,status:'RUNNING',startedAt:new Date()}});
  try{const rows=await reportRows(type);const resultData=format==='csv'?toCsv(rows):JSON.stringify(rows);return await prisma.reportJob.update({where:{id:job.id},data:{status:'COMPLETED',completedAt:new Date(),rowCount:rows.length,resultData}});}catch(error){await prisma.reportJob.update({where:{id:job.id},data:{status:'FAILED',failedAt:new Date(),error:error instanceof Error?error.message:'Unknown error'}});throw error;}
}
export async function listReportJobs(userId:string,all=false){return prisma.reportJob.findMany({where:all?{}:{requestedBy:userId},select:{id:true,reportType:true,format:true,status:true,requestedAt:true,completedAt:true,rowCount:true,error:true},orderBy:{requestedAt:'desc'},take:100});}
export async function getReportDownload(id:string,userId:string,all=false){return prisma.reportJob.findFirst({where:{id,...(all?{}:{requestedBy:userId})}});}

export async function dashboardSummary(){const now=new Date();const in30=new Date(now.getTime()+30*86400000);const [properties,bookings,allocations,agreements,outstanding,flatAlerts,unread]=await Promise.all([prisma.property.count({where:{deletedAt:null}}),prisma.booking.count({where:{status:{in:['PENDING_APPROVAL','APPROVED']}}}),prisma.allocation.count({where:{status:'ACTIVE'}}),prisma.shopAgreement.count({where:{status:'ACTIVE'}}),prisma.bill.aggregate({_sum:{balanceAmount:true},where:{balanceAmount:{gt:0}}}),prisma.flatAllocation.count({where:{status:'ACTIVE',expectedVacationDate:{lte:in30}}}),prisma.notification.count({where:{readAt:null}})]);return{properties,openBookings:bookings,activeOfficeAllocations:allocations,activeShopAgreements:agreements,outstandingBalance:outstanding._sum.balanceAmount??new Prisma.Decimal(0),flatVacationAlerts30Days:flatAlerts,unreadNotifications:unread};}

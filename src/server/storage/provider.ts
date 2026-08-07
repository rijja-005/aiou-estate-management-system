export type StoredObject={key:string;contentType:string;size:number};
export interface ObjectStorageProvider{put(key:string,data:Uint8Array,contentType:string):Promise<StoredObject>;signedDownloadUrl(key:string,expiresInSeconds:number):Promise<string>;delete(key:string):Promise<void>}
export function requireProductionStorageConfig(env:NodeJS.ProcessEnv=process.env):void{if(env.NODE_ENV==='production'&&(!env.OBJECT_STORAGE_ENDPOINT||!env.OBJECT_STORAGE_BUCKET))throw new Error('Production object storage is not configured');}

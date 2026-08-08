import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAMES } from '../../server/auth/constants';
import { getUserFromAccessToken } from '../../server/auth/service';
import { AppShell } from './app-shell';

export default async function ProtectedLayout({children}:Readonly<{children:React.ReactNode}>):Promise<React.ReactElement>{
 const accessToken=(await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value;const currentUser=await getUserFromAccessToken(accessToken);if(!currentUser)redirect('/login');return <AppShell displayName={currentUser.displayName}>{children}</AppShell>;
}

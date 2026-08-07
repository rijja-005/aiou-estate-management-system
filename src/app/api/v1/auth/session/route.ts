import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAMES } from '../../../../../server/auth/constants';
import { getUserFromAccessToken } from '../../../../../server/auth/service';

export async function GET(): Promise<NextResponse> {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const user = await getUserFromAccessToken(accessToken);

  if (!user) {
    return NextResponse.json({ success: true, data: { user: null } });
  }

  return NextResponse.json({
    success: true,
    data: {
      user,
    },
  });
}

import { NextResponse } from 'next/server';
import { requestPasswordReset } from '../../../../../../server/auth/password-reset';
import { passwordResetRequestSchema } from '../../../../../../server/auth/schemas';

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = passwordResetRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } }, { status: 400 });
  await requestPasswordReset(parsed.data.email).catch(() => undefined);
  return NextResponse.json({ success: true, data: { message: 'If the account exists, password reset instructions will be sent.' } });
}

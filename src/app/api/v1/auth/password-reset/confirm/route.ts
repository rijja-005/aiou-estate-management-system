import { NextResponse } from 'next/server';
import { confirmPasswordReset } from '../../../../../../server/auth/password-reset';
import { passwordResetConfirmSchema } from '../../../../../../server/auth/schemas';

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = passwordResetConfirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Password does not meet security requirements' } }, { status: 400 });
  try {
    await confirmPasswordReset(parsed.data);
    return NextResponse.json({ success: true, data: { passwordReset: true } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'AUTH_RESET_INVALID', message: 'The reset link is invalid or expired' } }, { status: 400 });
  }
}

import { NextRequest } from 'next/server';
import { APIError, ErrorCode } from './errors';
import type { AuthenticatedUser } from './auth';

/**
 * Gets the target patient ID for data access based on user role and request params.
 *
 * Authorization logic:
 * - Patients can only access their own data (patientId query param is ignored)
 * - PTs and admins can access any patient's data (patientId query param is required)
 *
 * @param request - The incoming NextRequest
 * @param user - The authenticated user
 * @returns The patient ID to use for data access
 * @throws APIError with BAD_REQUEST if PT/admin doesn't provide patientId
 * @throws APIError with FORBIDDEN if user role is not recognized
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const user = await getCurrentUser();
 *   const patientId = getTargetPatientId(request, user);
 *   const records = await db.select().from(table).where(eq(table.patientId, patientId));
 *   return success(records);
 * }
 */
export function getTargetPatientId(request: NextRequest, user: AuthenticatedUser): string {
  const { searchParams } = new URL(request.url);
  const requestedPatientId = searchParams.get('patientId');

  if (user.role === 'patient') {
    // Patients can only access their own data
    return user.id;
  }

  if (user.role === 'pt' || user.role === 'admin') {
    // PTs and admins can access any patient's data, but must specify which patient
    if (requestedPatientId) {
      return requestedPatientId;
    }
    throw new APIError(
      ErrorCode.BAD_REQUEST,
      'patientId query parameter is required for PT/admin access'
    );
  }

  // Unknown role - deny access
  throw new APIError(ErrorCode.FORBIDDEN, 'Unauthorized access');
}

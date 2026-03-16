import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// Verification types mapping
const VERIFICATION_TYPE_TO_USER_FIELD: Record<string, string> = {
  AADHAAR: 'aadhaarVerified',
  PAN: 'panVerified',
  BANK_ACCOUNT: 'bankAccountVerified',
};

// GET: Get verification details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const verification = await db.verification.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            district: true,
            state: true,
            isVerified: true,
            aadhaarVerified: true,
            panVerified: true,
            bankAccountVerified: true,
          },
        },
      },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    const currentUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check authorization - only the verification owner or admin can view
    if (verification.userId !== currentUser.id && currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ verification });
  } catch (error) {
    console.error('Error fetching verification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification' },
      { status: 500 }
    );
  }
}

// PATCH: Admin approve/reject verification
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can approve/reject
    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can approve/reject verifications' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason, adminNotes, reviewedBy } = body;

    const verification = await db.verification.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    // Validate status
    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // If rejecting, require rejection reason
    if (status === 'REJECTED' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting' },
        { status: 400 }
      );
    }

    // Update verification status
    const updatedVerification = await db.verification.update({
      where: { id },
      data: {
        status: status as any,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        adminNotes,
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
      },
    });

    // If approved, update user's verification status
    if (status === 'APPROVED') {
      const updateData: any = {
        verifiedBy: adminUser.id,
      };

      // Map verification type to user field
      const userField = VERIFICATION_TYPE_TO_USER_FIELD[verification.type];
      if (userField) {
        updateData[userField] = true;
      }

      // Check if all required verifications are done
      const allVerifications = await db.verification.findMany({
        where: {
          userId: verification.userId,
          status: 'APPROVED',
        },
      });

      const requiredTypes = ['AADHAAR', 'PAN', 'BANK_ACCOUNT'];
      const allRequiredApproved = requiredTypes.every(type =>
        allVerifications.some(v => v.type === type)
      );

      if (allRequiredApproved) {
        updateData.isVerified = true;
        updateData.verifiedAt = new Date();
      }

      await db.user.update({
        where: { id: verification.userId },
        data: updateData,
      });
    }

    // Create notification for the farmer
    const notificationTitle = status === 'APPROVED' 
      ? 'Verification Approved' 
      : status === 'REJECTED'
      ? 'Verification Rejected'
      : 'Verification Under Review';

    const notificationMessage = status === 'APPROVED'
      ? `Your ${verification.type.toLowerCase().replace('_', ' ')} verification has been approved.`
      : status === 'REJECTED'
      ? `Your ${verification.type.toLowerCase().replace('_', ' ')} verification was rejected. Reason: ${rejectionReason}`
      : `Your ${verification.type.toLowerCase().replace('_', ' ')} verification is under review.`;

    await db.notification.create({
      data: {
        userId: verification.userId,
        type: 'VERIFICATION_STATUS',
        title: notificationTitle,
        message: notificationMessage,
        data: JSON.stringify({ verificationId: verification.id, status }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Verification ${status.toLowerCase()}`,
      verification: updatedVerification,
    });
  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    );
  }
}

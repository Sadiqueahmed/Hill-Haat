import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// GET: Get all verification requests (admin only)
export async function GET(request: NextRequest) {
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

    // Only admins can view all verifications
    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can access this endpoint' },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    
    if (status && ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }
    
    if (type && ['AADHAAR', 'PAN', 'BANK_ACCOUNT', 'ORGANIC_CERT', 'LAND_RECORDS', 'FARMER_ID'].includes(type)) {
      where.type = type;
    }

    // Get verifications with user info
    const verifications = await db.verification.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            district: true,
            state: true,
            isVerified: true,
            aadhaarVerified: true,
            panVerified: true,
            bankAccountVerified: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Filter by search if provided
    let filteredVerifications = verifications;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredVerifications = verifications.filter(v => 
        v.user.name.toLowerCase().includes(searchLower) ||
        v.user.email.toLowerCase().includes(searchLower) ||
        (v.documentNumber?.toLowerCase().includes(searchLower)) ||
        (v.documentName?.toLowerCase().includes(searchLower))
      );
    }

    // Get total count for pagination
    const totalCount = await db.verification.count({ where });

    // Get statistics
    const stats = {
      total: await db.verification.count(),
      pending: await db.verification.count({ where: { status: 'PENDING' } }),
      underReview: await db.verification.count({ where: { status: 'UNDER_REVIEW' } }),
      approved: await db.verification.count({ where: { status: 'APPROVED' } }),
      rejected: await db.verification.count({ where: { status: 'REJECTED' } }),
    };

    return NextResponse.json({
      verifications: filteredVerifications,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      stats,
    });
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verifications' },
      { status: 500 }
    );
  }
}

// PATCH: Bulk update verification status (admin only)
export async function PATCH(request: NextRequest) {
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

    // Only admins can bulk update
    if (adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can perform bulk updates' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { verificationIds, status, rejectionReason, adminNotes } = body;

    if (!verificationIds || !Array.isArray(verificationIds) || verificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Verification IDs are required' },
        { status: 400 }
      );
    }

    if (!['APPROVED', 'REJECTED', 'UNDER_REVIEW'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // If rejecting, require rejection reason
    if (status === 'REJECTED' && !rejectionReason) {
      return NextResponse.json(
        { error: 'Rejection reason is required for bulk rejection' },
        { status: 400 }
      );
    }

    // Update all verifications
    const updatePromises = verificationIds.map(async (id: string) => {
      const verification = await db.verification.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!verification) return null;

      // Update verification status
      const updated = await db.verification.update({
        where: { id },
        data: {
          status: status as any,
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
          adminNotes,
          reviewedBy: adminUser.id,
          reviewedAt: new Date(),
        },
      });

      // If approved, update user verification flags
      if (status === 'APPROVED') {
        const updateData: any = {
          verifiedBy: adminUser.id,
        };

        // Map verification type to user field
        const typeToField: Record<string, string> = {
          AADHAAR: 'aadhaarVerified',
          PAN: 'panVerified',
          BANK_ACCOUNT: 'bankAccountVerified',
        };

        const field = typeToField[verification.type];
        if (field) {
          updateData[field] = true;
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

      return updated;
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(Boolean).length;

    return NextResponse.json({
      success: true,
      message: `${successCount} verifications updated successfully`,
      updatedCount: successCount,
    });
  } catch (error) {
    console.error('Error updating verifications:', error);
    return NextResponse.json(
      { error: 'Failed to update verifications' },
      { status: 500 }
    );
  }
}

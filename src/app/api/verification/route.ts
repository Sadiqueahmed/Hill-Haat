import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

// Verification types with their display info and validation rules
const VERIFICATION_TYPE_INFO = {
  AADHAAR: {
    name: 'Aadhaar Card',
    description: 'Government-issued identity card',
    required: true,
    icon: '🪪',
    fields: ['documentNumber', 'documentName'],
    validation: {
      documentNumber: {
        pattern: /^\d{12}$/,
        message: 'Aadhaar number must be 12 digits',
      },
    },
    simulateApi: true,
    apiEndpoint: 'https://uidai.gov.in/api/verify',
  },
  PAN: {
    name: 'PAN Card',
    description: 'Permanent Account Number for tax purposes',
    required: true,
    icon: '💳',
    fields: ['documentNumber', 'documentName'],
    validation: {
      documentNumber: {
        pattern: /^[A-Z]{5}\d{4}[A-Z]{1}$/,
        message: 'PAN must be in format: ABCDE1234F',
      },
    },
    simulateApi: true,
    apiEndpoint: 'https://tin-nsdl.com/api/verify',
  },
  BANK_ACCOUNT: {
    name: 'Bank Account',
    description: 'Bank account for receiving payments',
    required: true,
    icon: '🏦',
    fields: ['documentNumber', 'documentName', 'ifscCode', 'bankName'],
    validation: {
      documentNumber: {
        pattern: /^\d{9,18}$/,
        message: 'Account number must be 9-18 digits',
      },
      ifscCode: {
        pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
        message: 'Invalid IFSC code format',
      },
    },
    simulateApi: true,
    apiEndpoint: 'https://api.bankverification.in/verify',
  },
  ORGANIC_CERT: {
    name: 'Organic Certificate',
    description: 'Organic farming certification',
    required: false,
    icon: '🌿',
    fields: ['documentNumber', 'documentName', 'documentExpiry', 'certifyingBody'],
    validation: {},
    simulateApi: true,
    apiEndpoint: 'https://organic-cert.gov.in/api/verify',
  },
  LAND_RECORDS: {
    name: 'Land Records/Patta',
    description: 'Land ownership documents',
    required: false,
    icon: '📄',
    fields: ['documentNumber', 'documentName', 'landArea', 'landLocation'],
    validation: {},
    simulateApi: true,
    apiEndpoint: 'https://landrecords.gov.in/api/verify',
  },
  FARMER_ID: {
    name: 'State Farmer ID',
    description: 'State-issued farmer identification',
    required: false,
    icon: '🆔',
    fields: ['documentNumber', 'documentName', 'issuingState'],
    validation: {},
    simulateApi: true,
    apiEndpoint: 'https://farmerid.gov.in/api/verify',
  },
};

// GET: Get verification status for current user
// Query params: type - Get status for specific verification type
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        verifications: {
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for type query parameter
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // If type is specified, return type-specific info
    if (type) {
      const verificationType = type.toUpperCase() as keyof typeof VERIFICATION_TYPE_INFO;
      
      if (!VERIFICATION_TYPE_INFO[verificationType]) {
        return NextResponse.json(
          { error: 'Invalid verification type' },
          { status: 400 }
        );
      }

      const typeConfig = VERIFICATION_TYPE_INFO[verificationType];
      const typeVerifications = user.verifications.filter(v => v.type === verificationType);
      const latestVerification = typeVerifications[0];

      // Check user's verification status for this type
      const userVerificationField = {
        AADHAAR: user.aadhaarVerified,
        PAN: user.panVerified,
        BANK_ACCOUNT: user.bankAccountVerified,
      }[verificationType];

      return NextResponse.json({
        type: verificationType,
        config: {
          name: typeConfig.name,
          description: typeConfig.description,
          fields: typeConfig.fields,
          validation: typeConfig.validation,
          required: typeConfig.required,
          icon: typeConfig.icon,
        },
        status: latestVerification?.status || 'NOT_SUBMITTED',
        isVerified: userVerificationField || false,
        latestVerification,
        verificationHistory: typeVerifications.slice(0, 5),
      });
    }

    // Get latest verification for each type
    const latestVerifications: Record<string, typeof user.verifications[0] | null> = {};
    const typeStatus: Record<string, { status: string; verified: boolean; pendingId?: string }> = {};
    
    for (const type of Object.keys(VERIFICATION_TYPE_INFO)) {
      const latest = user.verifications.find(v => v.type === type);
      latestVerifications[type] = latest || null;
      
      if (latest?.status === 'APPROVED') {
        typeStatus[type] = { status: 'APPROVED', verified: true };
      } else if (latest?.status === 'PENDING' || latest?.status === 'UNDER_REVIEW') {
        typeStatus[type] = { status: latest.status, verified: false, pendingId: latest.id };
      } else if (latest?.status === 'REJECTED') {
        typeStatus[type] = { status: 'REJECTED', verified: false };
      } else {
        typeStatus[type] = { status: 'NOT_SUBMITTED', verified: false };
      }
    }

    // Calculate overall verification status
    const requiredTypes = Object.entries(VERIFICATION_TYPE_INFO)
      .filter(([_, info]) => info.required)
      .map(([type]) => type);
    
    const allRequiredVerified = requiredTypes.every(type => typeStatus[type]?.verified);
    const overallStatus = {
      isFullyVerified: allRequiredVerified,
      verifiedCount: Object.values(typeStatus).filter(s => s.verified).length,
      totalCount: Object.keys(VERIFICATION_TYPE_INFO).length,
      requiredVerified: requiredTypes.filter(type => typeStatus[type]?.verified).length,
      requiredTotal: requiredTypes.length,
    };

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        aadhaarVerified: user.aadhaarVerified,
        panVerified: user.panVerified,
        bankAccountVerified: user.bankAccountVerified,
        isVerified: user.isVerified,
        verifiedAt: user.verifiedAt,
      },
      typeInfo: VERIFICATION_TYPE_INFO,
      typeStatus,
      latestVerifications,
      overallStatus,
      allVerifications: user.verifications,
    });
  } catch (error) {
    console.error('Error fetching verification status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}

// POST: Submit verification request with simulated API verification
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only farmers can submit verification
    if (user.role !== 'FARMER') {
      return NextResponse.json(
        { error: 'Only farmers can submit verification requests' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, documentUrl, documentNumber, documentName, documentExpiry, remarks, ifscCode, bankName, certifyingBody, landArea, landLocation, issuingState } = body;

    // Validate verification type
    if (!type || !VERIFICATION_TYPE_INFO[type as keyof typeof VERIFICATION_TYPE_INFO]) {
      return NextResponse.json(
        { error: 'Invalid verification type. Supported types: AADHAAR, PAN, BANK_ACCOUNT, ORGANIC_CERT, LAND_RECORDS, FARMER_ID' },
        { status: 400 }
      );
    }

    const typeConfig = VERIFICATION_TYPE_INFO[type as keyof typeof VERIFICATION_TYPE_INFO];

    // Validate required fields
    const validationErrors: string[] = [];
    
    if (!documentNumber) {
      validationErrors.push('Document number is required');
    } else if (typeConfig.validation.documentNumber?.pattern) {
      const pattern = typeConfig.validation.documentNumber.pattern;
      if (!pattern.test(documentNumber)) {
        validationErrors.push(typeConfig.validation.documentNumber.message);
      }
    }

    if (!documentName) {
      validationErrors.push('Document holder name is required');
    }

    // Type-specific validations
    if (type === 'BANK_ACCOUNT') {
      if (!ifscCode) {
        validationErrors.push('IFSC code is required for bank account verification');
      } else if (typeConfig.validation.ifscCode?.pattern) {
        if (!typeConfig.validation.ifscCode.pattern.test(ifscCode)) {
          validationErrors.push(typeConfig.validation.ifscCode.message);
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Check if there's already a pending or approved verification for this type
    const existingVerification = await db.verification.findFirst({
      where: {
        userId: user.id,
        type: type as any,
        status: { in: ['PENDING', 'UNDER_REVIEW', 'APPROVED'] },
      },
    });

    if (existingVerification) {
      if (existingVerification.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'This verification type is already approved' },
          { status: 400 }
        );
      }
      if (existingVerification.status === 'PENDING' || existingVerification.status === 'UNDER_REVIEW') {
        return NextResponse.json(
          { error: 'A verification request is already pending for this type' },
          { status: 400 }
        );
      }
    }

    // Simulate API verification call
    let apiVerificationResult = null;
    if (typeConfig.simulateApi) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate verification (90% success rate for demo)
      const isSuccess = Math.random() > 0.1;
      
      apiVerificationResult = {
        success: isSuccess,
        message: isSuccess 
          ? `${typeConfig.name} verified successfully via ${typeConfig.apiEndpoint}`
          : 'Document verification failed. Please check your details.',
        referenceId: `VERIFY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        verifiedAt: isSuccess ? new Date().toISOString() : null,
      };
    }

    // Create verification request
    const verification = await db.verification.create({
      data: {
        userId: user.id,
        type: type as any,
        status: 'PENDING',
        documentUrl,
        documentNumber,
        documentName,
        documentExpiry: documentExpiry ? new Date(documentExpiry) : null,
        remarks,
        // Store additional type-specific data in adminNotes as JSON
        adminNotes: JSON.stringify({
          ifscCode,
          bankName,
          certifyingBody,
          landArea,
          landLocation,
          issuingState,
          apiVerificationResult,
        }),
      },
    });

    // Create notification for admins
    const admins = await db.user.findMany({
      where: { role: 'ADMIN' },
    });

    await db.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'VERIFICATION_STATUS',
        title: 'New Verification Request',
        message: `${user.name} submitted ${VERIFICATION_TYPE_INFO[type as keyof typeof VERIFICATION_TYPE_INFO].name} verification`,
        data: JSON.stringify({ verificationId: verification.id, farmerId: user.id }),
      })),
    });

    return NextResponse.json({
      success: true,
      message: 'Verification request submitted successfully',
      verification,
      apiVerification: apiVerificationResult,
    });
  } catch (error) {
    console.error('Error submitting verification:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification request' },
      { status: 500 }
    );
  }
}

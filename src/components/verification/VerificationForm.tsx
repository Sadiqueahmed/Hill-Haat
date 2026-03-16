'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload, 
  FileText, 
  Shield, 
  TrendingUp, 
  Award,
  AlertCircle,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

// Verification types info
const VERIFICATION_TYPES = {
  AADHAAR: {
    name: 'Aadhaar Card',
    description: 'Government-issued identity card',
    required: true,
    icon: '🪪',
    fields: ['documentNumber', 'documentName'],
    numberLabel: 'Aadhaar Number',
    numberPlaceholder: '12-digit Aadhaar number',
    namePlaceholder: 'Name as per Aadhaar',
    benefits: ['Identity verification', 'Eligible for government schemes', 'Faster payouts'],
  },
  PAN: {
    name: 'PAN Card',
    description: 'Permanent Account Number for tax purposes',
    required: true,
    icon: '💳',
    fields: ['documentNumber', 'documentName'],
    numberLabel: 'PAN Number',
    numberPlaceholder: '10-character PAN',
    namePlaceholder: 'Name as per PAN',
    benefits: ['Tax compliance', 'Higher transaction limits', 'Professional credibility'],
  },
  BANK_ACCOUNT: {
    name: 'Bank Account',
    description: 'Bank account for receiving payments',
    required: true,
    icon: '🏦',
    fields: ['documentNumber', 'documentName'],
    numberLabel: 'Account Number',
    numberPlaceholder: 'Bank account number',
    namePlaceholder: 'Account holder name',
    benefits: ['Direct payments', 'Secure transactions', 'Automatic settlements'],
  },
  ORGANIC_CERT: {
    name: 'Organic Certificate',
    description: 'Organic farming certification',
    required: false,
    icon: '🌿',
    fields: ['documentNumber', 'documentName', 'documentExpiry'],
    numberLabel: 'Certificate Number',
    numberPlaceholder: 'Certificate reference number',
    namePlaceholder: 'Certification body',
    benefits: ['Premium pricing', 'Organic badge on listings', 'Access to organic markets'],
  },
  LAND_RECORDS: {
    name: 'Land Records/Patta',
    description: 'Land ownership documents',
    required: false,
    icon: '📄',
    fields: ['documentNumber', 'documentName'],
    numberLabel: 'Patta/Document Number',
    numberPlaceholder: 'Land document reference',
    namePlaceholder: 'Owner name as per records',
    benefits: ['Verified farmer status', 'Land-backed trust', 'Government scheme eligibility'],
  },
  FARMER_ID: {
    name: 'State Farmer ID',
    description: 'State-issued farmer identification',
    required: false,
    icon: '🆔',
    fields: ['documentNumber', 'documentName'],
    numberLabel: 'Farmer ID Number',
    numberPlaceholder: 'State farmer ID',
    namePlaceholder: 'Name as per Farmer ID',
    benefits: ['Official farmer recognition', 'Priority in schemes', 'Exclusive marketplace features'],
  },
};

interface VerificationStatus {
  status: string;
  verified: boolean;
  pendingId?: string;
}

interface Verification {
  id: string;
  type: string;
  status: string;
  documentNumber?: string;
  documentName?: string;
  rejectionReason?: string;
  submittedAt: string;
}

interface VerificationData {
  user: {
    id: string;
    name: string;
    role: string;
    aadhaarVerified: boolean;
    panVerified: boolean;
    bankAccountVerified: boolean;
    isVerified: boolean;
  };
  typeInfo: typeof VERIFICATION_TYPES;
  typeStatus: Record<string, VerificationStatus>;
  latestVerifications: Record<string, Verification | null>;
  overallStatus: {
    isFullyVerified: boolean;
    verifiedCount: number;
    totalCount: number;
    requiredVerified: number;
    requiredTotal: number;
  };
}

export function VerificationForm() {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<keyof typeof VERIFICATION_TYPES | null>(null);
  const [formData, setFormData] = useState({
    documentNumber: '',
    documentName: '',
    documentExpiry: '',
    remarks: '',
  });

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('/api/verification');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching verification status:', error);
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType) return;

    setSubmitting(selectedType);

    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          documentNumber: formData.documentNumber,
          documentName: formData.documentName,
          documentExpiry: formData.documentExpiry || null,
          remarks: formData.remarks || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit');
      }

      toast.success('Verification request submitted successfully');
      setSelectedType(null);
      setFormData({ documentNumber: '', documentName: '', documentExpiry: '', remarks: '' });
      fetchVerificationStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit verification');
    } finally {
      setSubmitting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified</Badge>;
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> {status === 'UNDER_REVIEW' ? 'Under Review' : 'Pending'}</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Unable to load verification data</p>
        </CardContent>
      </Card>
    );
  }

  const progress = (data.overallStatus.verifiedCount / data.overallStatus.totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Status Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Verification Status
          </CardTitle>
          <CardDescription>
            Complete your verification to unlock all farmer benefits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {data.overallStatus.verifiedCount} of {data.overallStatus.totalCount} verified
            </span>
            <span className="text-sm font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          
          {data.overallStatus.isFullyVerified ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700">Fully Verified Farmer</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-700">
                {data.overallStatus.requiredTotal - data.overallStatus.requiredVerified} required verifications pending
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Benefits of Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Higher Visibility</p>
                <p className="text-xs text-muted-foreground">Verified farmers get priority in search results</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Trust Badge</p>
                <p className="text-xs text-muted-foreground">Build buyer confidence with verified status</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Faster Payments</p>
                <p className="text-xs text-muted-foreground">Priority settlement for verified sellers</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Types */}
      <div className="grid gap-4">
        {Object.entries(VERIFICATION_TYPES).map(([type, info]) => {
          const status = data.typeStatus[type];
          const verification = data.latestVerifications[type];

          return (
            <Card key={type} className="overflow-hidden">
              <div className="flex items-center p-4 gap-4">
                <div className="text-3xl">{info.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{info.name}</h3>
                    {info.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                    {getStatusBadge(status?.status || 'NOT_SUBMITTED')}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {status?.status === 'APPROVED' ? (
                    <Button variant="outline" size="sm" disabled className="text-green-600 border-green-200">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Verified
                    </Button>
                  ) : status?.status === 'PENDING' || status?.status === 'UNDER_REVIEW' ? (
                    <Button variant="outline" size="sm" disabled>
                      <Clock className="w-4 h-4 mr-1" />
                      In Review
                    </Button>
                  ) : status?.status === 'REJECTED' ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200">
                          <XCircle className="w-4 h-4 mr-1" />
                          Re-submit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Re-submit {info.name}</DialogTitle>
                          <DialogDescription>
                            Your previous submission was rejected. Please review the reason and submit again.
                          </DialogDescription>
                        </DialogHeader>
                        {verification?.rejectionReason && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-700">Rejection Reason:</p>
                            <p className="text-sm text-red-600">{verification.rejectionReason}</p>
                          </div>
                        )}
                        <VerificationDialogContent
                          info={info}
                          formData={formData}
                          setFormData={setFormData}
                          onSubmit={() => {
                            setSelectedType(type as keyof typeof VERIFICATION_TYPES);
                            handleSubmit();
                          }}
                          submitting={submitting === type}
                        />
                      </DialogContent>
                    </Dialog>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Upload className="w-4 h-4 mr-1" />
                          Submit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Verify {info.name}</DialogTitle>
                          <DialogDescription>
                            Enter your document details for verification
                          </DialogDescription>
                        </DialogHeader>
                        <VerificationDialogContent
                          info={info}
                          formData={formData}
                          setFormData={setFormData}
                          onSubmit={() => {
                            setSelectedType(type as keyof typeof VERIFICATION_TYPES);
                            handleSubmit();
                          }}
                          submitting={submitting === type}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              
              {/* Benefits */}
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-1">
                  {info.benefits.map((benefit, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Separate component for dialog content
function VerificationDialogContent({
  info,
  formData,
  setFormData,
  onSubmit,
  submitting,
}: {
  info: typeof VERIFICATION_TYPES[keyof typeof VERIFICATION_TYPES];
  formData: { documentNumber: string; documentName: string; documentExpiry: string; remarks: string };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="documentNumber">{info.numberLabel}</Label>
        <Input
          id="documentNumber"
          placeholder={info.numberPlaceholder}
          value={formData.documentNumber}
          onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="documentName">Document Holder Name</Label>
        <Input
          id="documentName"
          placeholder={info.namePlaceholder}
          value={formData.documentName}
          onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
        />
      </div>
      {info.fields.includes('documentExpiry') && (
        <div className="space-y-2">
          <Label htmlFor="documentExpiry">Expiry Date (if applicable)</Label>
          <Input
            id="documentExpiry"
            type="date"
            value={formData.documentExpiry}
            onChange={(e) => setFormData({ ...formData, documentExpiry: e.target.value })}
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="remarks">Additional Remarks (optional)</Label>
        <Textarea
          id="remarks"
          placeholder="Any additional information..."
          value={formData.remarks}
          onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button 
          onClick={onSubmit} 
          disabled={submitting || !formData.documentNumber || !formData.documentName}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit for Verification
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}

export default VerificationForm;

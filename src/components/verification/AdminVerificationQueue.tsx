'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Calendar,
  FileText,
  AlertTriangle,
  Loader2,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Types
type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
type VerificationType = 'AADHAAR' | 'PAN' | 'BANK_ACCOUNT' | 'ORGANIC_CERT' | 'LAND_RECORDS' | 'FARMER_ID';

interface VerificationRequest {
  id: string;
  userId: string;
  type: VerificationType;
  status: VerificationStatus;
  documentNumber?: string;
  documentName?: string;
  documentExpiry?: string;
  remarks?: string;
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    district?: string;
    state?: string;
    isVerified: boolean;
    aadhaarVerified: boolean;
    panVerified: boolean;
    bankAccountVerified: boolean;
  };
}

// Verification type display names
const VERIFICATION_TYPE_NAMES: Record<VerificationType, string> = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  BANK_ACCOUNT: 'Bank Account',
  ORGANIC_CERT: 'Organic Certificate',
  LAND_RECORDS: 'Land Records',
  FARMER_ID: 'Farmer ID',
};

// Status badge colors
const getStatusColor = (status: VerificationStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'UNDER_REVIEW':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function AdminVerificationQueue() {
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'submittedAt' | 'type' | 'status'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Dialog states
  const [selectedVerification, setSelectedVerification] = useState<VerificationRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const response = await fetch('/api/admin/verifications');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setVerifications(data.verifications || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort verifications
  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = 
      v.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (v.documentName?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesType = typeFilter === 'all' || v.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'submittedAt') {
      comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    } else if (sortBy === 'type') {
      comparison = a.type.localeCompare(b.type);
    } else if (sortBy === 'status') {
      comparison = a.status.localeCompare(b.status);
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Stats
  const stats = {
    total: verifications.length,
    pending: verifications.filter(v => v.status === 'PENDING').length,
    underReview: verifications.filter(v => v.status === 'UNDER_REVIEW').length,
    approved: verifications.filter(v => v.status === 'APPROVED').length,
    rejected: verifications.filter(v => v.status === 'REJECTED').length,
  };

  // Handle individual approval
  const handleApprove = async (verification: VerificationRequest) => {
    setSubmitting(verification.id);
    try {
      const response = await fetch(`/api/verification/${verification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'APPROVED',
          adminNotes,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to approve');
      
      toast.success(`${VERIFICATION_TYPE_NAMES[verification.type]} approved for ${verification.user.name}`);
      setShowApproveDialog(false);
      setSelectedVerification(null);
      setAdminNotes('');
      fetchVerifications();
    } catch (error) {
      toast.error('Failed to approve verification');
    } finally {
      setSubmitting(null);
    }
  };

  // Handle individual rejection
  const handleReject = async (verification: VerificationRequest) => {
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    
    setSubmitting(verification.id);
    try {
      const response = await fetch(`/api/verification/${verification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason,
          adminNotes,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to reject');
      
      toast.success(`${VERIFICATION_TYPE_NAMES[verification.type]} rejected for ${verification.user.name}`);
      setShowRejectDialog(false);
      setSelectedVerification(null);
      setRejectionReason('');
      setAdminNotes('');
      fetchVerifications();
    } catch (error) {
      toast.error('Failed to reject verification');
    } finally {
      setSubmitting(null);
    }
  };

  // Handle bulk actions
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    
    setSubmitting('bulk');
    try {
      const promises = selectedIds.map(id =>
        fetch(`/api/verification/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'APPROVED' }),
        })
      );
      
      await Promise.all(promises);
      toast.success(`${selectedIds.length} verifications approved`);
      setSelectedIds([]);
      fetchVerifications();
    } catch (error) {
      toast.error('Failed to approve some verifications');
    } finally {
      setSubmitting(null);
    }
  };

  const handleBulkReject = async () => {
    if (selectedIds.length === 0) return;
    if (!rejectionReason.trim()) {
      toast.error('Rejection reason is required for bulk rejection');
      return;
    }
    
    setSubmitting('bulk');
    try {
      const promises = selectedIds.map(id =>
        fetch(`/api/verification/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'REJECTED', rejectionReason }),
        })
      );
      
      await Promise.all(promises);
      toast.success(`${selectedIds.length} verifications rejected`);
      setSelectedIds([]);
      setRejectionReason('');
      fetchVerifications();
    } catch (error) {
      toast.error('Failed to reject some verifications');
    } finally {
      setSubmitting(null);
    }
  };

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredVerifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredVerifications.map(v => v.id));
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

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md border-l-4 border-l-amber-400">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Under Review</p>
            <p className="text-2xl font-bold text-blue-600">{stats.underReview}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md border-l-4 border-l-emerald-400">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rejected</p>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or document..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="AADHAAR">Aadhaar</SelectItem>
                  <SelectItem value="PAN">PAN</SelectItem>
                  <SelectItem value="BANK_ACCOUNT">Bank Account</SelectItem>
                  <SelectItem value="ORGANIC_CERT">Organic Cert</SelectItem>
                  <SelectItem value="LAND_RECORDS">Land Records</SelectItem>
                  <SelectItem value="FARMER_ID">Farmer ID</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'desc' ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-700">
                {selectedIds.length} selected
              </span>
              <Separator orientation="vertical" className="h-5" />
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleBulkApprove}
                disabled={submitting === 'bulk'}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={submitting === 'bulk'}
              >
                <X className="h-4 w-4 mr-1" />
                Reject Selected
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification List */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="divide-y">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 font-medium text-sm">
                <Checkbox
                  checked={selectedIds.length === filteredVerifications.length && filteredVerifications.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <div className="flex-1">User Details</div>
                <div className="w-32 text-center">Type</div>
                <div className="w-28 text-center">Status</div>
                <div className="w-32 text-center">Submitted</div>
                <div className="w-28 text-center">Actions</div>
              </div>
              
              {/* Items */}
              {filteredVerifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No verification requests found</p>
                </div>
              ) : (
                filteredVerifications.map((verification) => (
                  <div
                    key={verification.id}
                    className={cn(
                      'flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors',
                      selectedIds.includes(verification.id) && 'bg-emerald-50'
                    )}
                  >
                    <Checkbox
                      checked={selectedIds.includes(verification.id)}
                      onCheckedChange={() => toggleSelect(verification.id)}
                    />
                    
                    {/* User Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {verification.user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{verification.user.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {verification.user.email}
                          </p>
                          {verification.user.district && verification.user.state && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {verification.user.district}, {verification.user.state}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Type */}
                    <div className="w-32 text-center">
                      <Badge variant="outline" className="font-medium">
                        {VERIFICATION_TYPE_NAMES[verification.type]}
                      </Badge>
                    </div>
                    
                    {/* Status */}
                    <div className="w-28 text-center">
                      <Badge className={cn('border', getStatusColor(verification.status))}>
                        {verification.status === 'UNDER_REVIEW' ? 'Review' : verification.status}
                      </Badge>
                    </div>
                    
                    {/* Submitted Date */}
                    <div className="w-32 text-center text-sm text-muted-foreground">
                      {new Date(verification.submittedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    
                    {/* Actions */}
                    <div className="w-28 flex justify-center gap-1">
                      {verification.status === 'PENDING' || verification.status === 'UNDER_REVIEW' ? (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => {
                              setSelectedVerification(verification);
                              setShowApproveDialog(true);
                            }}
                            disabled={submitting === verification.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedVerification(verification);
                              setShowRejectDialog(true);
                            }}
                            disabled={submitting === verification.id}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Approve Verification
            </DialogTitle>
            <DialogDescription>
              Approve {selectedVerification && VERIFICATION_TYPE_NAMES[selectedVerification.type]} verification for {selectedVerification?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVerification && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p><strong>Document:</strong> {selectedVerification.documentName}</p>
                <p><strong>Number:</strong> {selectedVerification.documentNumber}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Admin Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes about this approval..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => selectedVerification && handleApprove(selectedVerification)}
              disabled={submitting === selectedVerification?.id}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Verification
            </DialogTitle>
            <DialogDescription>
              Reject {selectedVerification && VERIFICATION_TYPE_NAMES[selectedVerification.type]} verification for {selectedVerification?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedVerification && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg text-sm">
                <p><strong>Document:</strong> {selectedVerification.documentName}</p>
                <p><strong>Number:</strong> {selectedVerification.documentNumber}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Admin Notes (optional)</Label>
                <Textarea
                  placeholder="Internal notes about this rejection..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedVerification && handleReject(selectedVerification)}
              disabled={submitting === selectedVerification?.id || !rejectionReason.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminVerificationQueue;

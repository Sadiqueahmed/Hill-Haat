'use client';

import { Shield, CheckCircle2, Clock, XCircle, AlertCircle, BadgeCheck, Landmark, FileText, Leaf, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Verification types
export type VerificationType = 'AADHAAR' | 'PAN' | 'BANK_ACCOUNT' | 'ORGANIC_CERT' | 'LAND_RECORDS' | 'FARMER_ID';
export type VerificationStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED';

// Verification type configurations
export const VERIFICATION_TYPE_CONFIG = {
  AADHAAR: {
    name: 'Aadhaar Card',
    shortName: 'Aadhaar',
    description: 'Government ID verified',
    icon: BadgeCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  PAN: {
    name: 'PAN Card',
    shortName: 'PAN',
    description: 'Tax ID verified',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  BANK_ACCOUNT: {
    name: 'Bank Account',
    shortName: 'Bank',
    description: 'Bank account verified',
    icon: Landmark,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  ORGANIC_CERT: {
    name: 'Organic Certificate',
    shortName: 'Organic',
    description: 'Organic certification verified',
    icon: Leaf,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
  LAND_RECORDS: {
    name: 'Land Records',
    shortName: 'Land',
    description: 'Land ownership verified',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  FARMER_ID: {
    name: 'Farmer ID',
    shortName: 'Farmer ID',
    description: 'State farmer ID verified',
    icon: BadgeCheck,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
  },
};

interface VerifiedBadgeProps {
  type?: VerificationType;
  status?: VerificationStatus;
  isVerified?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'icon' | 'full';
  className?: string;
  verifiedAt?: string | Date | null;
}

export function VerifiedBadge({
  type,
  status,
  isVerified,
  showLabel = true,
  size = 'sm',
  variant = 'badge',
  className,
  verifiedAt,
}: VerifiedBadgeProps) {
  // Determine status from props
  const actualStatus: VerificationStatus = status || (isVerified ? 'APPROVED' : 'NOT_SUBMITTED');

  // Size configurations
  const sizeConfig = {
    sm: { icon: 'h-3 w-3', text: 'text-xs', badge: 'px-2 py-0.5' },
    md: { icon: 'h-4 w-4', text: 'text-sm', badge: 'px-2.5 py-1' },
    lg: { icon: 'h-5 w-5', text: 'text-base', badge: 'px-3 py-1.5' },
  };

  // Status configurations
  const getStatusConfig = (status: VerificationStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          icon: CheckCircle2,
          label: 'Verified',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        };
      case 'PENDING':
      case 'UNDER_REVIEW':
        return {
          icon: Clock,
          label: status === 'UNDER_REVIEW' ? 'Under Review' : 'Pending',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          badgeClass: 'bg-amber-100 text-amber-700 border-amber-200',
        };
      case 'REJECTED':
        return {
          icon: XCircle,
          label: 'Rejected',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeClass: 'bg-red-100 text-red-700 border-red-200',
        };
      default:
        return {
          icon: AlertCircle,
          label: 'Not Verified',
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
        };
    }
  };

  const statusConfig = getStatusConfig(actualStatus);
  const typeConfig = type ? VERIFICATION_TYPE_CONFIG[type] : null;
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig?.icon || Shield;

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('inline-flex items-center justify-center', className)}>
              <StatusIcon className={cn(sizeConfig[size].icon, statusConfig.color)} />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{typeConfig ? typeConfig.name : 'Verification'}: {statusConfig.label}</p>
            {verifiedAt && actualStatus === 'APPROVED' && (
              <p className="text-xs text-muted-foreground">
                Verified on {new Date(verifiedAt).toLocaleDateString('en-IN')}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full variant with icon and details
  if (variant === 'full' && typeConfig) {
    return (
      <div className={cn('flex items-center gap-2 p-2 rounded-lg border', statusConfig.bgColor, statusConfig.borderColor, className)}>
        <TypeIcon className={cn(sizeConfig[size].icon, statusConfig.color)} />
        <div className="flex-1 min-w-0">
          <p className={cn('font-medium', sizeConfig[size].text)}>{typeConfig.name}</p>
          <p className="text-xs text-muted-foreground">{statusConfig.label}</p>
        </div>
        <StatusIcon className={cn(sizeConfig[size].icon, statusConfig.color)} />
      </div>
    );
  }

  // Default badge variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'gap-1 font-medium border',
              sizeConfig[size].badge,
              statusConfig.badgeClass,
              className
            )}
          >
            <StatusIcon className={sizeConfig[size].icon} />
            {showLabel && (
              <span className={sizeConfig[size].text}>
                {typeConfig ? typeConfig.shortName : statusConfig.label}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{typeConfig ? typeConfig.name : 'Verification'}: {statusConfig.label}</p>
          {verifiedAt && actualStatus === 'APPROVED' && (
            <p className="text-xs text-muted-foreground">
              Verified on {new Date(verifiedAt).toLocaleDateString('en-IN')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Verified Seller Badge - Special badge for verified sellers
export function VerifiedSellerBadge({
  isVerified,
  size = 'sm',
  showLabel = true,
  className,
}: {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}) {
  const sizeConfig = {
    sm: { icon: 'h-3 w-3', text: 'text-xs', badge: 'px-2 py-0.5' },
    md: { icon: 'h-4 w-4', text: 'text-sm', badge: 'px-2.5 py-1' },
    lg: { icon: 'h-5 w-5', text: 'text-base', badge: 'px-3 py-1.5' },
  };

  if (!isVerified) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={cn(
              'gap-1 font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0',
              sizeConfig[size].badge,
              className
            )}
          >
            <Shield className={sizeConfig[size].icon} />
            {showLabel && <span className={sizeConfig[size].text}>Verified Seller</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Seller</p>
          <p className="text-xs text-muted-foreground">
            This seller has completed identity verification
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Verification Badges Group - Display multiple verification badges
export function VerificationBadgesGroup({
  verifications,
  maxVisible = 3,
  size = 'sm',
}: {
  verifications: Array<{ type: VerificationType; status: VerificationStatus; verifiedAt?: string | Date | null }>;
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const approvedVerifications = verifications.filter(v => v.status === 'APPROVED');
  const visibleVerifications = approvedVerifications.slice(0, maxVisible);
  const remainingCount = approvedVerifications.length - maxVisible;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleVerifications.map((v, index) => (
        <VerifiedBadge
          key={index}
          type={v.type}
          status={v.status}
          size={size}
          verifiedAt={v.verifiedAt}
          showLabel={false}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}

export default VerifiedBadge;

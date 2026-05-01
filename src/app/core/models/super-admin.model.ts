export interface GlobalDashboardSummaryApiResponse {
  totalTenants: number;
  totalActiveTenants: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  newTenantsThisMonth: number;
}

export interface EnrichedTenant {
  id: number;
  code: string;
  name: string;
  status: string;
  createdAt: string;
  ownerName: string;
  ownerEmail: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  validUntil: string | null;
}

export interface EnrichedTenantPageApiResponse {
  content: EnrichedTenant[];
  pageable: {
    pageNumber: number;
    pageSize: number;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
}

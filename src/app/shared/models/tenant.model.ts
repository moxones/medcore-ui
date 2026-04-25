export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  status: string;
}

export type ProviderType = 'public_provider' | 'custom_provider' | 'proxy_service';

export interface AliasRule {
  ignore: boolean;
  strip: boolean;
}

export interface ProviderAlias {
  dots?: AliasRule;
  plus?: AliasRule;
  case?: AliasRule;
}

export interface KnownProvider {
  companyProvider: string;
  loginUrl: string | null;
  domains: string[];
  type: ProviderType;
  alias?: ProviderAlias;
}

export interface SimplifiedProvider {
  companyProvider: string;
  loginUrl: string | null;
  type: ProviderType;
}

export interface LookupError {
  type: 'INVALID_EMAIL' | 'UNKNOWN_DOMAIN' | 'IDN_VALIDATION_ERROR';
  message: string;
  idnError?: string;
}

export interface LookupResult {
  provider: SimplifiedProvider | null;
  email: string;
  detectionMethod?: 'domain_match';
  error?: LookupError;
}

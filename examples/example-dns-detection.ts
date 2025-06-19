import { 
  getEmailProviderLink, 
  getEmailProviderLinkWithDNS, 
  detectProviderByDNS 
} from '../src/index';

/**
 * Example demonstrating DNS-based custom domain detection
 */
async function demonstrateDNSDetection() {
  console.log('=== Email Provider Links with DNS Detection ===\n');

  // Example 1: Standard domain detection (no DNS lookup needed)
  console.log('1. Standard Domain Detection:');
  const gmailResult = getEmailProviderLink('user@gmail.com');
  console.log(`   Email: user@gmail.com`);
  console.log(`   Provider: ${gmailResult.provider?.companyProvider}`);
  console.log(`   Login URL: ${gmailResult.loginUrl}\n`);

  // Example 2: DNS-based detection for custom business domains
  console.log('2. DNS-based Detection for Custom Domains:');
  
  // Test domains that might use Microsoft 365
  const testDomains = [
    'user@contoso.com',        // Example Microsoft 365 domain
    'user@acme-corp.com',      // Example Google Workspace domain
    'user@mycompany.org'       // Unknown domain
  ];

  for (const email of testDomains) {
    console.log(`\n   Testing: ${email}`);
    
    // First try standard detection
    const standardResult = getEmailProviderLink(email);
    console.log(`   Standard detection: ${standardResult.provider ? standardResult.provider.companyProvider : 'Not found'}`);
    
    try {
      // Then try DNS-based detection
      const dnsResult = await getEmailProviderLinkWithDNS(email);
      console.log(`   DNS detection: ${dnsResult.provider ? dnsResult.provider.companyProvider : 'Not found'}`);
      console.log(`   Detection method: ${dnsResult.detectionMethod || 'none'}`);
      console.log(`   Login URL: ${dnsResult.loginUrl || 'none'}`);
    } catch (error) {
      console.log(`   DNS lookup failed: ${error.message}`);
    }
  }

  // Example 3: Direct DNS detection for a domain
  console.log('\n3. Direct DNS Detection:');
  const domain = 'microsoft.com';
  console.log(`   Checking DNS records for: ${domain}`);
  
  try {
    const dnsDetection = await detectProviderByDNS(domain);
    if (dnsDetection.provider) {
      console.log(`   Provider detected: ${dnsDetection.provider.companyProvider}`);
      console.log(`   Detection method: ${dnsDetection.detectionMethod}`);
    } else {
      console.log(`   No provider detected via DNS`);
    }
  } catch (error) {
    console.log(`   DNS detection failed: ${error.message}`);
  }

  console.log('\n=== DNS Detection Patterns ===');
  console.log('Microsoft 365 Detection:');
  console.log('  - MX patterns: outlook.com, protection.outlook.com, office365.com');
  console.log('  - TXT patterns: spf.protection.outlook.com, MS=ms');
  
  console.log('\nGoogle Workspace Detection:');
  console.log('  - MX patterns: google.com, aspmx.l.google.com');
  console.log('  - TXT patterns: _spf.google.com, google-site-verification=');
  
  console.log('\nZoho Workplace Detection:');
  console.log('  - MX patterns: zoho.com, mx.zoho.com');
  console.log('  - TXT patterns: zoho.com, zoho-verification=');
}

// Example usage function for React/frontend
export function useEmailProviderWithDNS(email: string) {
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (!email) return;
    
    setLoading(true);
    getEmailProviderLinkWithDNS(email)
      .then(setResult)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [email]);
  
  return { result, loading };
}

// Run the demonstration
if (require.main === module) {
  demonstrateDNSDetection().catch(console.error);
}


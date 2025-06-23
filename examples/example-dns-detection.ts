import { 
  getEmailProviderSync, 
  getEmailProvider, 
  getEmailProviderFast 
} from '../src/index';

/**
 * Example demonstrating DNS-based custom domain detection
 */
async function demonstrateDNSDetection() {
  console.log('=== Email Provider Links with DNS Detection ===\n');

  // Example 1: Standard domain detection (no DNS lookup needed)
  console.log('1. Standard Domain Detection:');
  const gmailResult = getEmailProviderSync('user@gmail.com');
  console.log(`   Email: user@gmail.com`);
  console.log(`   Provider: ${gmailResult.provider?.companyProvider}`);
  console.log(`   Login URL: ${gmailResult.loginUrl}\n`);

  // Example 2: DNS-based detection for custom business domains
  console.log('2. DNS-based Detection for Custom Domains:');
  
  // Test domains that might use business email providers
  const testDomains = [
    'user@microsoft.com',        // Example Microsoft 365 domain
    'user@google.com',           // Example Google Workspace domain
    'user@mycompany.org'         // Unknown domain
  ];

  for (const email of testDomains) {
    console.log(`\n   Testing: ${email}`);
    
    // First try standard detection
    const standardResult = getEmailProviderSync(email);
    console.log(`   Standard detection: ${standardResult.provider ? standardResult.provider.companyProvider : 'Not found'}`);
    
    try {
      // Then try DNS-based detection
      const dnsResult = await getEmailProvider(email);
      console.log(`   DNS detection: ${dnsResult.provider ? dnsResult.provider.companyProvider : 'Not found'}`);
      console.log(`   Detection method: ${dnsResult.detectionMethod || 'none'}`);
      console.log(`   Login URL: ${dnsResult.loginUrl || 'none'}`);
      if (dnsResult.error) {
        console.log(`   Error: ${dnsResult.error.message}`);
      }
    } catch (error) {
      console.log(`   DNS lookup failed: ${(error as Error).message}`);
    }
  }

  // Example 3: High-performance detection with timing metrics
  console.log('\n3. High-Performance Detection:');
  const email = 'user@microsoft.com';
  console.log(`   Testing fast detection for: ${email}`);
  
  try {
    const fastResult = await getEmailProviderFast(email, {
      enableParallel: true,
      collectDebugInfo: true
    });
    
    if (fastResult.provider) {
      console.log(`   Provider detected: ${fastResult.provider.companyProvider}`);
      console.log(`   Detection method: ${fastResult.detectionMethod}`);
      console.log(`   Detection time: ${fastResult.timing?.total}ms`);
      console.log(`   Confidence: ${fastResult.confidence}`);
    } else {
      console.log(`   No provider detected`);
      if (fastResult.error) {
        console.log(`   Error: ${fastResult.error.message}`);
      }
    }
  } catch (error) {
    console.log(`   Fast detection failed: ${(error as Error).message}`);
  }

  console.log('\n=== DNS Detection Patterns ===');
  console.log('Microsoft 365 Detection:');
  console.log('  - MX patterns: outlook.com, protection.outlook.com, office365.com');
  console.log('  - TXT patterns: spf.protection.outlook.com, MS=ms');
  
  console.log('\nGoogle Workspace Detection:');
  console.log('  - MX patterns: google.com, aspmx.l.google.com');
  console.log('  - TXT patterns: _spf.google.com, google-site-verification=');
  
  console.log('\nAmazon WorkMail Detection:');
  console.log('  - MX patterns: awsapps.com');
  console.log('  - TXT patterns: amazonses.com');
}

// Example usage function for React/frontend
export function useEmailProviderWithDNS(email: string) {
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (!email) return;
    
    setLoading(true);
    getEmailProvider(email)
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

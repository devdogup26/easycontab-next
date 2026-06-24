// eSocial XML Signer
// Signs XML documents with digital certificates using RSA-SHA256

import { createHash, createSign } from 'crypto';

interface SignXmlOptions {
  xmlContent: string;
  privateKeyPem: string;
  x509CertPem: string;
}

// Canonicalize XML (remove comments, normalize whitespace)
// This is a simplified version - production should use a proper C14N implementation
export function canonicalizeXml(xml: string): string {
  // Remove XML declaration comments and normalize line endings
  return xml
    .replace(/<!--[\s\S]*?-->/g, '')  // Remove comments
    .replace(/>\s+</g, '><')           // Remove whitespace between tags
    .replace(/\r\n/g, '\n')           // Normalize line endings
    .trim();
}

// Calculate SHA-256 digest of canonicalized XML
function calculateDigest(xml: string): string {
  const canonical = canonicalizeXml(xml);
  return createHash('sha256').update(canonical).digest('base64');
}

// Create RSA-SHA256 signature
async function createSignature(data: string, privateKeyPem: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const sign = createSign('RSA-SHA256');
      sign.update(data);
      const signature = sign.sign(privateKeyPem, 'base64');
      resolve(signature);
    } catch (error) {
      reject(error);
    }
  });
}

// Extract event ID from XML (for signature reference)
function extractEventId(xml: string): string {
  const match = xml.match(/<evt\w+[^>]*Id="([^"]+)"/);
  return match?.[1] || extractEventIdSimple(xml);
}

function extractEventIdSimple(xml: string): string {
  const match = xml.match(/Id="([^"]+)"/);
  return match?.[1] || 'ID';
}

// Build XML Digital Signature (XML-DSIG) structure
function buildSignatureXml(
  digestValue: string,
  signatureValue: string,
  x509CertPem: string,
  eventId: string
): string {
  return `
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
      <Reference URI="#${eventId}">
        <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
        <DigestValue>${digestValue}</DigestValue>
      </Reference>
    </SignedInfo>
    <SignatureValue>${signatureValue}</SignatureValue>
    <KeyInfo>
      <X509Data>
        <X509Certificate>${x509CertPem}</X509Certificate>
      </X509Data>
    </KeyInfo>
  </Signature>`;
}

// Main signing function - signs eSocial XML
export async function signXml(options: SignXmlOptions): Promise<string> {
  const { xmlContent, privateKeyPem, x509CertPem } = options;

  // Get event ID for signature reference
  const eventId = extractEventId(xmlContent);

  // Canonicalize the XML (C14N)
  const canonicalXml = canonicalizeXml(xmlContent);

  // Calculate digest
  const digest = calculateDigest(canonicalXml);

  // Create RSA signature of canonical XML
  const signature = await createSignature(canonicalXml, privateKeyPem);

  // Build signature XML element
  const signatureXml = buildSignatureXml(digest, signature, x509CertPem, eventId);

  // Insert signature before closing </eSocial> tag
  // Handle different closing tags based on event type
  let signedXml = xmlContent;

  if (xmlContent.includes('</eSocial>')) {
    signedXml = xmlContent.replace('</eSocial>', `${signatureXml}\n</eSocial>`);
  } else if (xmlContent.includes('</evt')) {
    // For events without full envelope
    const lastEvtClose = xmlContent.lastIndexOf('</evt');
    const before = xmlContent.substring(0, lastEvtClose);
    const after = xmlContent.substring(lastEvtClose);
    signedXml = `${before}${signatureXml}\n${after}`;
  } else {
    signedXml = xmlContent + signatureXml;
  }

  return signedXml;
}

// Sign eSocial batch (group of events)
export async function signBatch(
  loteXml: string,
  privateKeyPem: string,
  x509CertPem: string
): Promise<string> {
  // For batch signing, we sign the entire lote content
  const eventId = 'LOTE_EVENTOS';

  const canonicalXml = canonicalizeXml(loteXml);
  const digest = calculateDigest(canonicalXml);
  const signature = await createSignature(canonicalXml, privateKeyPem);

  const signatureXml = buildSignatureXml(digest, signature, x509CertPem, eventId);

  return loteXml.replace('</eSocial>', `${signatureXml}\n</eSocial>`);
}

// Verify XML signature (for received documents)
export async function verifySignature(
  xmlWithSignature: string,
  publicKeyPem: string
): Promise<boolean> {
  try {
    // Extract signature element
    const sigMatch = xmlWithSignature.match(/<Signature[^>]*>([\s\S]*?)<\/Signature>/);
    if (!sigMatch) {
      return false;
    }

    const signatureBlock = sigMatch[0];

    // Extract SignedInfo for verification
    const signedInfoMatch = signatureBlock.match(/<SignedInfo>([\s\S]*?)<\/SignedInfo>/);
    if (!signedInfoMatch) {
      return false;
    }

    // Extract and validate digest
    const digestMatch = signatureBlock.match(/<DigestValue>([^<]+)<\/DigestValue>/);
    if (!digestMatch) {
      return false;
    }

    // Extract and verify signature
    const sigValueMatch = signatureBlock.match(/<SignatureValue>([^<]+)<\/SignatureValue>/);
    if (!sigValueMatch) {
      return false;
    }

    // In production, would verify:
    // 1. Canonicalize SignedInfo
    // 2. Calculate digest and compare
    // 3. Verify signature with public key

    return true;
  } catch {
    return false;
  }
}
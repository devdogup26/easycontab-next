import forge from 'node-forge';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export interface ParsedCertificate {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  thumbprint: string;
}

export async function parsePfxCertificate(
  pfxBuffer: Buffer,
  password: string
): Promise<ParsedCertificate> {
  return new Promise((resolve, reject) => {
    try {
      const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(pfxBuffer));
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const certBag = certBags[forge.pki.oids.certBag];

      if (!certBag || certBag.length === 0) {
        throw new Error('No certificate found in PFX file');
      }

      const cert = certBag[0].cert;
      if (!cert) {
        throw new Error('Certificate object not found in bag');
      }

      const validFrom = cert.validity.notBefore;
      const validTo = cert.validity.notAfter;
      const serialNumber = cert.serialNumber;
      const thumbprint = forge.md.sha1.create()
        .update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes())
        .digest().toHex();

      resolve({
        subject: cert.subject.attributes
          .map(attr => `${attr.shortName}=${attr.value}`)
          .join(', '),
        issuer: cert.issuer.attributes
          .map(attr => `${attr.shortName}=${attr.value}`)
          .join(', '),
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        serialNumber,
        thumbprint,
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function encryptContent(content: Buffer): Promise<Buffer> {
  const masterKey = Buffer.from(process.env.CERTIFICATE_MASTER_KEY || '', 'base64');
  if (masterKey.length === 0) throw new Error('CERTIFICATE_MASTER_KEY not defined');

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

  const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]);
}

export async function decryptContent(encryptedBuffer: Buffer): Promise<Buffer> {
  const masterKey = Buffer.from(process.env.CERTIFICATE_MASTER_KEY || '', 'base64');
  if (masterKey.length === 0) throw new Error('CERTIFICATE_MASTER_KEY not defined');

  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function determineCertStatus(validTo: Date): 'ATIVO' | 'VENCIDO' {
  const now = new Date();
  if (validTo < now) return 'VENCIDO';
  return 'ATIVO';
}

import { Injectable } from '@nestjs/common';
import { Facture } from '../finance/facture/facture.entity.js';

export interface DgiTransmissionResult {
  success: boolean;
  clearanceHash: string;
  transmittedAt: Date;
}

export interface SignedPayload<T> {
  data: T;
  signature: string;
  signedAt: Date;
}

@Injectable()
export class EInvoicingGateway {
  /**
   * Simulates transmission to the Morocco DGI e-invoicing platform.
   * Mutates the Facture entity fields — caller must persist after this call.
   */
  transmitToDgiClearance(invoice: Facture): DgiTransmissionResult {
    const clearanceHash = `DGI-${invoice.id}-${Date.now().toString(36).toUpperCase()}`;
    console.log(`[EInvoicingGateway] Transmitting ${invoice.referenceNumber} → DGI`);
    invoice.isClearedByDgi = true;
    invoice.dgiClearanceHash = clearanceHash;
    return { success: true, clearanceHash, transmittedAt: new Date() };
  }

  /**
   * Appends a base64 digital signature to any serialisable payload.
   * Replace with real HSM/PKI signing in production.
   */
  appendDigitalSignature<T>(payload: T): SignedPayload<T> {
    const signature = Buffer.from(JSON.stringify(payload)).toString('base64').slice(0, 64);
    console.log('[EInvoicingGateway] Digital signature appended.');
    return { data: payload, signature, signedAt: new Date() };
  }
}

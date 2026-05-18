import { ChildEntity, Column } from 'typeorm';
import { Document } from '../common/document.entity.js';

@ChildEntity('BC')
export class BonDeCommande extends Document {
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'client_po_reference', unique: true })
  clientPoReferenceNumber: string;

  @Column({ type: 'text', nullable: true, name: 'shipping_address' })
  shippingAddress: string;

  @Column({ type: 'text', nullable: true, name: 'billing_address' })
  billingAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  incoterms: string | null;

  @Column({ type: 'text', nullable: true, name: 'special_instructions' })
  specialInstructions: string | null;

  @Column({ type: 'datetime', nullable: true, name: 'signature_timestamp' })
  signatureTimestamp: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'signed_bc_file_url' })
  signedBcFileUrl: string | null;

  @Column({ type: 'date', nullable: true, name: 'estimated_delivery_date' })
  estimatedDeliveryDate: Date;

  constructor(partial?: Partial<BonDeCommande>) {
    super();
    Object.assign(this, partial);
  }
}

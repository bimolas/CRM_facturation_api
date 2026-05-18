import { ChildEntity, Column, OneToMany } from 'typeorm';
import { Document } from '../common/document.entity.js';
import { Paiement } from '../paiement/paiement.entity.js';

@ChildEntity('FACTURE')
export class Facture extends Document {
  @Column({ type: 'int', default: 30, name: 'payment_due_days' })
  paymentDueDays: number;

  @Column({ default: false, name: 'is_cleared_by_dgi' })
  isClearedByDgi: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'dgi_clearance_hash' })
  dgiClearanceHash: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vendor_bank_rib' })
  vendorBankRIB: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'invoice_file_url' })
  invoiceFileUrl: string | null;

  @Column({ type: 'date', nullable: true, name: 'date_depot' })
  dateDepot: Date | null;

  @Column({ type: 'date', nullable: true, name: 'date_encaissement' })
  dateEncaissement: Date | null;

  @Column({ type: 'enum', enum: ['VIREMENT', 'CHEQUE', 'ESPECES'], nullable: true, name: 'type_virement' })
  typeVirement: 'VIREMENT' | 'CHEQUE' | 'ESPECES' | null;

  @Column({ type: 'longtext', nullable: true, name: 'signature_base64' })
  signatureBase64: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'qr_code_hash' })
  qrCodeHash: string | null;

  @OneToMany(() => Paiement, (p) => p.facture, { cascade: true, eager: true })
  payments: Paiement[];

  constructor(partial?: Partial<Facture>) {
    super();
    Object.assign(this, partial);
  }

  get totalPaid(): number {
    return (this.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  }

  get remainingBalance(): number {
    return Number(this.totalTTC) - this.totalPaid;
  }
}

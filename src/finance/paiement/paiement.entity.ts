import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentType } from '../enum/payment-type.enum.js';
import { Facture } from '../facture/facture.entity.js';

@Entity('payments')
export class Paiement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'date', name: 'transaction_date' })
  transactionDate: Date;

  @Column({
    type: 'enum',
    enum: PaymentType,
    name: 'payment_method',
  })
  paymentMethod: PaymentType;

  @Column({ length: 255, nullable: true, name: 'bank_reference' })
  bankReference: string;

  @ManyToOne(() => Facture, (facture) => facture.payments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  facture: Facture;

  constructor(partial?: Partial<Paiement>) {
    Object.assign(this, partial);
  }
}

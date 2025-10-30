import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from 'src/products/entities/product.entity';

@Entity('print_jobs')
export class PrintJob {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ligne: string;

  @Column()
  reference: string;

  @Column()
  quantity: number;

  @Column({ length: 50 })
  matricule: string;

  @Column({ type: 'date' })
  printDate: string;

  @Column()
  startProgressive: number;

  @Column()
  endProgressive: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

   @Column({ 
    type: 'varchar', 
    length: 10, 
    default: 'DATAMATRIX' 
  })
  codeType: string; // 'QRCODE' ou 'DATAMATRIX'

  @Column()
  userId: number; // ID de l'utilisateur qui a lancé l'impression

  @ManyToOne(() => Product)
  @JoinColumn([
    { name: 'ligne', referencedColumnName: 'ligne' },
    { name: 'reference', referencedColumnName: 'reference' }
  ])
  product: Product;

  @OneToMany(() => PrintTicket, ticket => ticket.printJob)
  tickets: PrintTicket[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('print_tickets')
export class PrintTicket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullProductNumber: string;

  @Column({ type: 'text' })
  codeImage: string; // Data URL du code (QR ou DataMatrix)

  @Column({ 
    type: 'varchar', 
    length: 10, 
    default: 'DATAMATRIX' 
  })
  codeType: string; // 'QRCODE' ou 'DATAMATRIX'


  @Column({ length: 50 })
  matricule: string;

  @Column({ type: 'date' })
  printDate: string;

  @Column({ length: 4 })
  progressiveNumber: string;

  @Column()
  ligne: string;

   @Column({ length: 20 })
  aiec: string;

  @Column()
  reference: string;

  @Column({ length: 10 })
  indice: string;

  @Column({ length: 2 })
  codeFournisseur: string;

   @Column({ length: 20, nullable: true })
  champS: string;

  @ManyToOne(() => PrintJob, printJob => printJob.tickets)
  printJob: PrintJob;

  @CreateDateColumn()
  createdAt: Date;
}

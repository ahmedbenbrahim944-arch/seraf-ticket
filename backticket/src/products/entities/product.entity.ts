import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum FournisseurCode {
  M0 = 'M0', // REFAS
  M1 = 'M1'  // SERAF
}

@Entity('products')
@Index(['ligne', 'reference'], { unique: true }) // Index unique sur la combinaison ligne + reference
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  ligne: string; // Nouveau champ - Ligne (ex: L04-RXT1)

  @Column()
  reference: string; // Nouveau champ - Référence (ex: RA5246801)

  @Column()
  uniqueProductId: number; // Plus une clé primaire, devient un champ normal

  @Column({ length: 1 })
  annee: string; // E - Année (dernière lettre de l'année)

  @Column({ length: 2, default: '10' })
  semaine: string; // 10 - Numéro de la semaine

  @Column({ type: 'int', default: 0 })
  numeroProgressif: number; // 0001 - Numéro progressif (compteur d'impression)

  @Column({
    type: 'enum',
    enum: FournisseurCode,
    default: FournisseurCode.M0
  })
  codeFournisseur: FournisseurCode; // M0 ou M1

  @Column({ length: 10, default: '040' })
  indice: string; // 040 - Indice fixé par l'admin

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  compteurImpression: number; // Compteur pour l'incrémentation lors d'impression

  @Column({ length: 50, nullable: true })
  typeTicket: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Méthode pour générer le numéro complet du produit
  getFullProductNumber(): string {
    const formattedProgressive = this.numeroProgressif.toString().padStart(4, '0');
    return `${this.annee}${this.semaine}${formattedProgressive}${this.uniqueProductId}${this.codeFournisseur}${this.indice}`;
  }
}

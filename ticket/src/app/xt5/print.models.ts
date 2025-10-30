export interface Ligne {
  id: string;
  name: string;
}

export interface Reference {
  id: string;
  name: string;
  ligneId: string;
  numeroProgressif?: number;
  codeFournisseur?: string;
  indice?: string;
  uniqueProductId?: number;
}

export interface PrintHistory {
  id: number;
  ligne: string;
  reference: string;
  quantity: number;
  matricule: string;
  printDate: string;
  startProgressive: number;
  endProgressive: number;
  createdAt: string;
}

export interface PrintStats {
  totalJobs: number;
  totalPrinted: number;
  byMatricule: any[];
  byProduct: any[];
}

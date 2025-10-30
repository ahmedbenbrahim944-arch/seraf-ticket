// src/common/utils/date-converter.util.ts
export class DateConverter {
  private static readonly YEAR_MAPPING: { [key: number]: string } = {
    2020: 'A',
    2021: 'B', 
    2022: 'C',
    2023: 'D',
    2024: 'E',
    2025: 'F',
    2026: 'G',
    2027: 'H',
    2028: 'I',
    2029: 'J',
    2030: 'K'
  };

  private static readonly REVERSE_YEAR_MAPPING: { [key: string]: number } = {
    'A': 2020,
    'B': 2021,
    'C': 2022, 
    'D': 2023,
    'E': 2024,
    'F': 2025,
    'G': 2026,
    'H': 2027,
    'I': 2028,
    'J': 2029,
    'K': 2030
  };

  // Lettres disponibles pour l'extension automatique
  private static readonly AVAILABLE_LETTERS = 'LMNOPQRSTUVWXYZ0123456789';

  // Fonction pour calculer le numéro de semaine ISO
  static getISOWeekNumber(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNumber = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNumber + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 60 * 60 * 1000));
  }

  // Fonction pour générer automatiquement un code pour une nouvelle année
  private static generateYearCode(year: number): string {
    // Calculer l'index basé sur l'année de référence (2020)
    const baseYear = 2020;
    const yearIndex = year - baseYear;
    
    if (yearIndex < 0) {
      throw new Error(`Année ${year} antérieure à 2020 non supportée`);
    }
    
    if (yearIndex < 11) {
      // Utiliser les codes existants A-K pour 2020-2030
      return String.fromCharCode(65 + yearIndex); // A=65 en ASCII
    } else {
      // Utiliser les lettres/chiffres supplémentaires
      const extraIndex = yearIndex - 11;
      if (extraIndex < this.AVAILABLE_LETTERS.length) {
        return this.AVAILABLE_LETTERS[extraIndex];
      } else {
        // Si on dépasse les lettres/chiffres simples, utiliser une combinaison
        const firstChar = Math.floor(extraIndex / this.AVAILABLE_LETTERS.length);
        const secondChar = extraIndex % this.AVAILABLE_LETTERS.length;
        return this.AVAILABLE_LETTERS[firstChar] + this.AVAILABLE_LETTERS[secondChar];
      }
    }
  }

  // Fonction pour étendre automatiquement le mapping si nécessaire
  private static ensureYearSupported(year: number): void {
    if (!this.YEAR_MAPPING[year]) {
      const yearCode = this.generateYearCode(year);
      this.YEAR_MAPPING[year] = yearCode;
      this.REVERSE_YEAR_MAPPING[yearCode] = year;
      console.log(`Extension automatique: Année ${year} → Code ${yearCode}`);
    }
  }

  static convertDateToYearCode(date: Date): string {
    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
      throw new Error('Date invalide fournie à convertDateToYearCode');
    }

    const year = date.getFullYear();
    
    // Vérification de sécurité pour les années trop anciennes
    if (year < 2020) {
      throw new Error(`Année ${year} antérieure à 2020 non supportée. Vérifiez votre date d'impression.`);
    }

    // Vérification pour les années trop futures (limite raisonnable)
    if (year > 2100) {
      throw new Error(`Année ${year} trop future. Vérifiez votre date d'impression.`);
    }

    // Étendre automatiquement le support si nécessaire
    this.ensureYearSupported(year);
    
    return this.YEAR_MAPPING[year];
  }

  static convertDateToProductCodes(date: Date): { yearCode: string; weekNumber: string } {
    // Vérification supplémentaire de la date
    if (!date || isNaN(date.getTime())) {
      console.error('Date invalide reçue:', date);
      throw new Error('Date invalide. Vérifiez le format de la date d\'impression.');
    }

    console.log('Conversion de la date:', date);
    console.log('Année de la date:', date.getFullYear());

    const yearCode = this.convertDateToYearCode(date);
    const weekNumber = this.getISOWeekNumber(date).toString().padStart(2, '0');
    
    console.log(`Date ${date.toISOString()} → Année: ${yearCode}, Semaine: ${weekNumber}`);
    
    return { yearCode, weekNumber };
  }

  static parseFromFullProductNumber(fullProductNumber: string): { date: Date; progressive: number } {
    const yearCode = fullProductNumber.charAt(0);
    const weekNumber = fullProductNumber.substring(1, 3);
    const progressive = parseInt(fullProductNumber.substring(3, 8));
    
    const year = this.REVERSE_YEAR_MAPPING[yearCode];
    if (!year) {
      throw new Error(`Code année invalide: ${yearCode}`);
    }
    
    // Calculer la date à partir de l'année et de la semaine ISO
    const date = new Date(year, 0, 1 + (parseInt(weekNumber) - 1) * 7);
    const dayOfWeek = date.getDay();
    const ISOWeekStart = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    date.setDate(ISOWeekStart);
    
    return { date, progressive };
  }

  static parseDateString(dateString: string): Date {
    // Support des formats: DD/MM/YYYY, YYYY-MM-DD, etc.
    const parts = dateString.split(/[/\-]/);
    
    if (parts.length === 3) {
      // Format DD/MM/YYYY
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
      // Format YYYY-MM-DD
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    
    // Essayer de parser directement
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error('Format de date invalide. Utilisez DD/MM/YYYY ou YYYY-MM-DD');
    }
    
    return date;
  }

  // Fonction utilitaire pour diagnostiquer les problèmes de date
  static debugDate(date: any): void {
    console.log('=== DEBUG DATE ===');
    console.log('Type:', typeof date);
    console.log('Valeur:', date);
    console.log('Est Date?', date instanceof Date);
    if (date instanceof Date) {
      console.log('Date valide?', !isNaN(date.getTime()));
      console.log('Année:', date.getFullYear());
      console.log('ISO String:', date.toISOString());
    }
    console.log('==================');
  }
}
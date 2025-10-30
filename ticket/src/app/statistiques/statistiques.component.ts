import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StatisticsService, StatisticsResponse, StatisticsFilter } from './stat.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// Interface pour les options de période prédéfinies
interface PeriodOption {
  label: string;
  value: string;
  days?: number;
}

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './statistiques.component.html',
  styleUrls: ['./statistiques.component.css']
})
export class StatistiquesComponent implements OnInit, OnDestroy {
  private statisticsService = inject(StatisticsService);
  private router = inject(Router);

  statistics: StatisticsResponse | null = null;
  loading = true;
  error: string | null = null;

  // Filtres de dates
  startDate: string = '';
  endDate: string = '';
  showFilters = false;
  selectedPeriod: string = 'custom';

  // Options de période prédéfinies
  periodOptions: PeriodOption[] = [
    { label: 'Aujourd\'hui', value: 'today', days: 0 },
    { label: '7 derniers jours', value: 'week', days: 7 },
    { label: '30 derniers jours', value: 'month', days: 30 },
    { label: '90 derniers jours', value: 'quarter', days: 90 },
    { label: 'Cette année', value: 'year', days: 365 },
    { label: 'Période personnalisée', value: 'custom' }
  ];

  // Charts
  typeTicketChart: any;
  topReferencesChart: any;

  ngOnInit() {
    // Initialiser avec la période par défaut (30 derniers jours)
    this.initializeDefaultDates();
    this.loadStatistics();
  }

  ngOnDestroy() {
    // Nettoyer les graphiques lors de la destruction du composant
    if (this.typeTicketChart) {
      this.typeTicketChart.destroy();
    }
    if (this.topReferencesChart) {
      this.topReferencesChart.destroy();
    }
  }

  /**
   * Initialise les dates par défaut (30 derniers jours)
   */
  initializeDefaultDates() {
    this.selectedPeriod = 'month';
    this.setPeriodDates(30);
  }

  /**
   * Définit les dates en fonction du nombre de jours
   * @param days Nombre de jours à soustraire de la date actuelle
   */
  setPeriodDates(days: number) {
    const today = new Date();
    const startDate = new Date(today);
    
    if (days === 0) {
      // Aujourd'hui uniquement
      this.startDate = this.formatDateForInput(today);
      this.endDate = this.formatDateForInput(today);
    } else {
      // Période avec nombre de jours
      startDate.setDate(today.getDate() - days);
      this.startDate = this.formatDateForInput(startDate);
      this.endDate = this.formatDateForInput(today);
    }
  }

  /**
   * Formate une date au format YYYY-MM-DD pour les inputs HTML
   * @param date Date à formater
   * @returns Date formatée en string
   */
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Toggle l'affichage du panel des filtres
   */
  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  /**
   * Gère le changement de période prédéfinie
   * @param period Valeur de la période sélectionnée
   */
  onPeriodChange(period: string) {
    this.selectedPeriod = period;
    this.error = null;

    if (period !== 'custom') {
      const option = this.periodOptions.find(opt => opt.value === period);
      if (option && option.days !== undefined) {
        this.setPeriodDates(option.days);
        // Charger automatiquement les statistiques pour les périodes prédéfinies
        this.loadStatistics();
      }
    }
  }

  /**
   * Applique les filtres de dates
   */
  applyFilters() {
    // Validation des dates
    if (!this.startDate || !this.endDate) {
      this.error = 'Veuillez sélectionner une date de début et une date de fin.';
      return;
    }

    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    if (start > end) {
      this.error = 'La date de début doit être antérieure ou égale à la date de fin.';
      return;
    }

    // Vérifier que les dates ne sont pas dans le futur
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (start > today || end > today) {
      this.error = 'Les dates ne peuvent pas être dans le futur.';
      return;
    }

    // Vérifier la plage maximale (par exemple 1 an)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      this.error = 'La période ne peut pas dépasser 1 an (365 jours).';
      return;
    }

    this.loadStatistics();
  }

  /**
   * Réinitialise les filtres aux valeurs par défaut
   */
  resetFilters() {
    this.error = null;
    this.initializeDefaultDates();
    this.loadStatistics();
  }

  /**
   * Efface les filtres complètement
   */
  clearFilters() {
    this.startDate = '';
    this.endDate = '';
    this.selectedPeriod = 'custom';
    this.error = null;
  }

  /**
   * Charge les statistiques avec les filtres actuels
   */
  loadStatistics() {
    this.loading = true;
    this.error = null;

    const filters: StatisticsFilter = {
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined
    };

    this.statisticsService.getGlobalStatistics(filters).subscribe({
      next: (data) => {
        if (data.success && data.data) {
          this.statistics = data;
          this.loading = false;
          // Attendre que le DOM soit mis à jour avant de créer les graphiques
          setTimeout(() => this.createCharts(), 100);
        } else {
          this.error = 'Aucune donnée disponible pour cette période.';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.error = error.error?.message || 'Erreur lors du chargement des statistiques. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  /**
   * Obtient le nombre de jours entre deux dates
   * @returns Nombre de jours
   */
  getDaysBetweenDates(): number {
    if (!this.startDate || !this.endDate) return 0;
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Vérifie si une période est sélectionnée
   * @param period Valeur de la période
   * @returns true si la période est sélectionnée
   */
  isPeriodSelected(period: string): boolean {
    return this.selectedPeriod === period;
  }

  goBack() {
    this.router.navigate(['/side']);
  }

  createCharts() {
    if (!this.statistics) return;
    this.createTypeTicketChart();
    this.createTopReferencesChart();
  }

  createTypeTicketChart() {
    const ctx = document.getElementById('typeTicketChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.typeTicketChart) {
      this.typeTicketChart.destroy();
    }

    const data = this.statistics!.data.parTypeTicket;
    const labels = data.map(item => item.typeTicket || 'Non défini');
    const values = data.map(item => item.totalImprime);
    const backgroundColors = this.generateGradientColors(data.length);

    this.typeTicketChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: backgroundColors,
          borderWidth: 3,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          hoverBorderWidth: 4,
          hoverBorderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 13,
                family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              },
              color: 'rgba(255, 255, 255, 0.95)',
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: true,
            text: 'Répartition par Type de Ticket',
            font: {
              size: 18,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            color: 'rgba(255, 255, 255, 0.95)',
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(9, 13, 117, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = values.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return ` ${context.label}: ${this.formatNumber(value)} tickets (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1500,
          easing: 'easeInOutQuart'
        }
      }
    });
  }

  createTopReferencesChart() {
    const ctx = document.getElementById('topReferencesChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.topReferencesChart) {
      this.topReferencesChart.destroy();
    }

    const topRefs = this.statistics!.data.topReferences.slice(0, 10);
    const labels = topRefs.map(ref => `${ref.ligne}-${ref.reference}`);
    const values = topRefs.map(ref => ref.totalImprime);

    const gradientColors = values.map((_, index) => {
      const intensity = 1 - (index * 0.08);
      return `rgba(76, 217, 100, ${intensity})`;
    });

    this.topReferencesChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tickets Imprimés',
          data: values,
          backgroundColor: gradientColors,
          borderColor: 'rgba(52, 232, 158, 0.8)',
          borderWidth: 2,
          borderRadius: 0,
          hoverBackgroundColor: 'rgba(52, 232, 158, 0.9)',
          hoverBorderColor: '#fff',
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Top 10 des Références les Plus Imprimées',
            font: {
              size: 18,
              weight: 'bold',
              family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
            },
            color: 'rgba(255, 255, 255, 0.95)',
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            backgroundColor: 'rgba(9, 13, 117, 0.95)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: 'rgba(255, 255, 255, 0.3)',
            borderWidth: 1,
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: (context) => {
                return ` ${this.formatNumber(context.raw as number)} tickets`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
              lineWidth: 1
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.9)',
              font: {
                size: 12,
              },
              padding: 8,
              callback: function(value) {
                return value.toLocaleString('fr-FR');
              }
            },
            title: {
              display: true,
              text: 'Nombre de Tickets',
              color: 'rgba(255, 255, 255, 0.9)',
              font: {
                size: 13,
                weight: 'bold'
              },
              padding: 10
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.9)',
              font: {
                size: 11,
              },
              maxRotation: 45,
              minRotation: 45,
              padding: 8
            }
          }
        },
        animation: {
          duration: 1500,
          easing: 'easeInOutQuart',
          delay: (context) => {
            return context.dataIndex * 100;
          }
        }
      }
    });
  }

  generateGradientColors(count: number): string[] {
    const colors = [
      'rgba(76, 217, 100, 0.9)',
      'rgba(230, 146, 21, 0.9)',
      'rgba(79, 70, 229, 0.9)',
      'rgba(239, 68, 68, 0.9)',
      'rgba(245, 158, 11, 0.9)',
      'rgba(139, 92, 246, 0.9)',
      'rgba(6, 182, 212, 0.9)',
      'rgba(132, 204, 22, 0.9)',
      'rgba(249, 115, 22, 0.9)',
      'rgba(99, 102, 241, 0.9)',
      'rgba(236, 72, 153, 0.9)',
      'rgba(20, 184, 166, 0.9)',
      'rgba(234, 179, 8, 0.9)',
      'rgba(168, 85, 247, 0.9)',
      'rgba(59, 130, 246, 0.9)'
    ];
    return colors.slice(0, count);
  }

  getProgressBarWidth(pourcentage: number): string {
    return `${Math.min(pourcentage, 100)}%`;
  }

  formatNumber(num: number): string {
    if (!num && num !== 0) return '0';
    return num.toLocaleString('fr-FR');
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }
}
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TrajetService } from '../../services/trajet.service';
import { IaService, PricePredictionRequest } from '../../services/ia.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-trajet-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trajet-form.component.html',
  styleUrls: ['./trajet-form.component.css']
})
export class TrajetFormComponent implements OnInit {
  @Input() trajetId: string | null = null;
  @Output() formSubmitted = new EventEmitter<boolean>();

  trajet = {
    depart: '',
    destination: '',
    dateDepart: '',
    heure: '08:00', // Valeur par défaut pour l'heure
    placesDisponibles: 1,
    prix: 0,
    description: ''
  };

  isLoading = false;
  isPredictingPrice = false;
  errors: string[] = [];
  isEditMode = false;
  iaServiceAvailable = true; // Indicateur de disponibilité du service IA

  constructor(
    private trajetService: TrajetService,
    private iaService: IaService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Set default date to today
    const today = new Date();
    this.trajet.dateDepart = today.toISOString().split('T')[0];

    // Vérifier l'état du service IA
    this.checkIaServiceHealth();

    // Récupérer l'ID du trajet depuis les paramètres de l'URL si présent
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.trajetId = id;
        this.isEditMode = true;
        this.loadTrajet();
      }
    });

    // Utiliser l'Input trajetId si fourni directement
    if (this.trajetId && !this.isEditMode) {
      this.isEditMode = true;
      this.loadTrajet();
    }
  }

  // Vérifier si le service IA est disponible
  checkIaServiceHealth(): void {
    this.iaService.checkServiceHealth().subscribe({
      next: (response) => {
        this.iaServiceAvailable = response.status === 'ok';
        if (!this.iaServiceAvailable) {
          console.warn('Le service IA n\'est pas disponible. La prédiction automatique de prix est désactivée.');
        }
      },
      error: () => {
        this.iaServiceAvailable = false;
        console.warn('Le service IA n\'est pas disponible. La prédiction automatique de prix est désactivée.');
      }
    });
  }

  // Prédire le prix en fonction du nombre de places et des lieux
  predictPrice(): void {
    if (!this.iaServiceAvailable || this.trajet.placesDisponibles < 1) {
      return;
    }

    this.isPredictingPrice = true;

    const predictionRequest: PricePredictionRequest = {
      placesDisponibles: this.trajet.placesDisponibles,
      depart: this.trajet.depart,
      destination: this.trajet.destination
    };

    this.iaService.predictPrice(predictionRequest).subscribe({
      next: (response) => {
        this.isPredictingPrice = false;
        if (response.success) {
          // Format à 3 décimales
          this.trajet.prix = parseFloat(response.prixEstime.toFixed(3));

          // Afficher une notification de succès
          Swal.fire({
            title: 'Prix estimé',
            text: `Le prix estimé est de ${this.trajet.prix.toFixed(3)} dinars.`,
            icon: 'info',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          console.error('Erreur lors de la prédiction du prix:', response.message);
          Swal.fire({
            title: 'Erreur',
            text: 'Impossible de prédire le prix. Veuillez le saisir manuellement.',
            icon: 'warning',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
          });
        }
      },
      error: (error) => {
        this.isPredictingPrice = false;
        console.error('Erreur lors de la communication avec le service IA:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de prédire le prix. Veuillez le saisir manuellement.',
          icon: 'warning',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    });
  }

  // Réagir lorsque le nombre de places change
  onPlacesChanged(): void {
    if (this.iaServiceAvailable && !this.isEditMode) {
      if (this.trajet.depart && this.trajet.destination) {
        this.predictPrice();
      }
    }
  }

  loadTrajet(): void {
    if (!this.trajetId) return;

    this.isLoading = true;
    this.trajetService.getTrajetById(this.trajetId).subscribe({
      next: (response) => {
        if (response.success && response.trajet) {
          const dateObj = new Date(response.trajet.dateDepart);

          this.trajet = {
            depart: response.trajet.depart,
            destination: response.trajet.destination,
            dateDepart: dateObj.toISOString().split('T')[0],
            heure: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            placesDisponibles: response.trajet.placesDisponibles,
            // Format à 3 décimales
            prix: parseFloat(response.trajet.prix.toFixed(3)),
            description: response.trajet.description || ''
          };
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du trajet', error);
        this.errors.push('Erreur lors du chargement du trajet');
        this.isLoading = false;
      }
    });
  }

  validateForm(): boolean {
    this.errors = [];

    if (!this.trajet.depart) {
      this.errors.push('Le lieu de départ est obligatoire');
    }

    if (!this.trajet.destination) {
      this.errors.push('La destination est obligatoire');
    }

    if (!this.trajet.dateDepart) {
      this.errors.push('La date de départ est obligatoire');
    }

    if (!this.trajet.heure) {
      this.errors.push('L\'heure de départ est obligatoire');
    }

    if (this.trajet.placesDisponibles < 1) {
      this.errors.push('Le nombre de places disponibles doit être d\'au moins 1');
    }

    if (this.trajet.prix <= 0) {
      this.errors.push('Le prix doit être supérieur à 0');
    }

    return this.errors.length === 0;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      // Afficher les erreurs avec SweetAlert2
      Swal.fire({
        title: 'Erreur de validation',
        html: this.errors.map(err => `- ${err}`).join('<br>'),
        icon: 'error',
        confirmButtonText: 'Corriger'
      });
      return;
    }

    this.isLoading = true;

    // Combine date and time
    const dateTime = new Date(`${this.trajet.dateDepart}T${this.trajet.heure}`);

    // Format à 3 décimales avant d'envoyer
    const prixArrondi = parseFloat(this.trajet.prix.toFixed(3));

    const trajetData = {
      depart: this.trajet.depart,
      destination: this.trajet.destination,
      dateDepart: dateTime.toISOString(),
      placesDisponibles: this.trajet.placesDisponibles,
      prix: prixArrondi,
      description: this.trajet.description
    };

    if (this.trajetId) {
      // Update existing trajet
      this.trajetService.updateTrajet(this.trajetId, trajetData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.formSubmitted.emit(true);
            // Afficher un message de succès avec SweetAlert2
            Swal.fire({
              title: 'Trajet mis à jour',
              text: 'Votre trajet a été mis à jour avec succès!',
              icon: 'success',
              confirmButtonText: 'Super!'
            }).then(() => {
              // Rediriger vers le tableau de bord
              this.router.navigate(['/dashboard']);
            });
          } else {
            Swal.fire({
              title: 'Erreur',
              text: response.message || 'Une erreur est survenue lors de la mise à jour du trajet',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du trajet', error);
          Swal.fire({
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la mise à jour du trajet',
            icon: 'error',
            confirmButtonText: 'OK'
          });
          this.isLoading = false;
        }
      });
    } else {
      // Create new trajet
      this.trajetService.createTrajet(trajetData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.formSubmitted.emit(true);
            // Afficher un message de succès avec SweetAlert2
            Swal.fire({
              title: 'Trajet créé',
              text: 'Votre trajet a été créé avec succès!',
              icon: 'success',
              confirmButtonText: 'Super!'
            }).then(() => {
              // Rediriger vers le tableau de bord
              this.router.navigate(['/dashboard']);
            });
          } else {
            Swal.fire({
              title: 'Erreur',
              text: response.message || 'Une erreur est survenue lors de la création du trajet',
              icon: 'error',
              confirmButtonText: 'OK'
            });
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création du trajet', error);
          Swal.fire({
            title: 'Erreur',
            text: 'Une erreur est survenue lors de la création du trajet',
            icon: 'error',
            confirmButtonText: 'OK'
          });
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    // Demander confirmation avant d'annuler
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Les modifications non enregistrées seront perdues.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non, continuer la saisie'
    }).then((result) => {
      if (result.isConfirmed) {
        // Rediriger vers le tableau de bord lors de l'annulation
        this.router.navigate(['/dashboard']);
        this.formSubmitted.emit(false);
      }
    });
  }
}

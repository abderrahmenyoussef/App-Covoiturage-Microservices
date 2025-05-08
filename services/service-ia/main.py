from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os
from typing import Optional
import uvicorn
# Imports pour gRPC
import grpc
import ia_pb2
import ia_pb2_grpc
from concurrent import futures
import threading
import time
# Import pour charger les variables d'environnement
from dotenv import load_dotenv

# Charger les variables d'environnement du fichier .env
load_dotenv()

# Configuration à partir des variables d'environnement
API_HOST = os.getenv("HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))
GRPC_PORT = int(os.getenv("GRPC_PORT", 50053))
MODEL_PATH = os.getenv("MODEL_PATH", "price_estimator_model.pkl")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# Création de l'application FastAPI
app = FastAPI(
    title="API de Prédiction de Prix",
    description="API pour estimer le prix d'un trajet en covoiturage",
    version="1.0.0"
)

# Définition du modèle de données d'entrée
class TripInput(BaseModel):
    placesDisponibles: int = Field(..., 
                                  description="Nombre de places disponibles dans le véhicule",
                                  ge=1, le=6)
    depart: Optional[str] = Field(None, description="Ville de départ")
    destination: Optional[str] = Field(None, description="Ville de destination")

# Définition du modèle de données de sortie
class PriceEstimation(BaseModel):
    prixEstime: float = Field(..., description="Prix estimé du trajet en dinars")
    message: str = Field(..., description="Message informatif")

# Chargement du modèle
try:
    model = joblib.load(MODEL_PATH)
    print(f"Modèle chargé avec succès depuis {MODEL_PATH}")
except Exception as e:
    print(f"Erreur lors du chargement du modèle: {e}")
    model = None

# Implémentation du service gRPC
class PredictionServiceServicer(ia_pb2_grpc.PredictionServiceServicer):
    def PredictPrice(self, request, context):
        """
        Implémentation de la méthode PredictPrice définie dans le fichier proto
        Cette méthode est appelée par le service-trajet via gRPC
        """
        if model is None:
            return ia_pb2.PricePredictionResponse(
                success=False,
                message="Le modèle de prédiction n'a pas pu être chargé",
                prixEstime=0.0
            )
        
        try:
            # Prédiction du prix avec le modèle
            places_disponibles = np.array([[request.placesDisponibles]])
            predicted_price = model.predict(places_disponibles)[0]
            predicted_price = round(predicted_price, 3)  # Arrondi à 3 décimales
            
            # Construction du message de réponse
            location_info = ""
            if request.depart and request.destination:
                location_info = f" de {request.depart} à {request.destination}"
            
            message = f"Le prix estimé pour un trajet{location_info} avec {request.placesDisponibles} places disponibles est de {predicted_price} dinars."
            
            return ia_pb2.PricePredictionResponse(
                success=True,
                message=message,
                prixEstime=predicted_price
            )
        except Exception as e:
            return ia_pb2.PricePredictionResponse(
                success=False,
                message=f"Erreur lors de la prédiction: {str(e)}",
                prixEstime=0.0
            )

# Fonction pour démarrer le serveur gRPC
def start_grpc_server():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    ia_pb2_grpc.add_PredictionServiceServicer_to_server(
        PredictionServiceServicer(), server
    )
    server.add_insecure_port(f'[::]:{GRPC_PORT}')
    server.start()
    print(f"Serveur gRPC démarré sur le port {GRPC_PORT}")
    server.wait_for_termination()

@app.get("/")
async def root():
    """Point d'entrée racine de l'API"""
    return {"message": "Bienvenue sur l'API de prédiction de prix pour le service de covoiturage"}

@app.post("/predict/", response_model=PriceEstimation)
async def predict_price(trip: TripInput):
    """
    Prédit le prix d'un trajet en fonction du nombre de places disponibles
    
    - **placesDisponibles**: Nombre de places disponibles (1-6)
    - **depart**: Ville de départ (optionnel)
    - **destination**: Ville de destination (optionnel)
    
    Retourne le prix estimé du trajet
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Le modèle de prédiction n'a pas pu être chargé")
    
    # Prédiction du prix
    try:
        places_disponibles = np.array([[trip.placesDisponibles]])
        predicted_price = model.predict(places_disponibles)[0]
        
        # Arrondir à 3 décimales pour un affichage plus propre
        predicted_price = round(predicted_price, 3)  # Modifié de 2 à 3 décimales
        
        # Construction du message de réponse
        location_info = ""
        if trip.depart and trip.destination:
            location_info = f" de {trip.depart} à {trip.destination}"
        
        return PriceEstimation(
            prixEstime=predicted_price,
            message=f"Le prix estimé pour un trajet{location_info} avec {trip.placesDisponibles} places disponibles est de {predicted_price} dinars."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la prédiction: {str(e)}")

@app.get("/health/")
async def health_check():
    """Vérifie que l'API est en ligne et que le modèle est correctement chargé"""
    if model is None:
        return {"status": "error", "message": "Le modèle n'est pas chargé"}
    return {"status": "ok", "message": "Le service est en ligne et le modèle est chargé"}

# Configuration de l'environnement
@app.get("/config/")
async def get_config():
    """Affiche la configuration actuelle (utile pour le débogage)"""
    if DEBUG:
        return {
            "api_host": API_HOST,
            "api_port": API_PORT,
            "grpc_port": GRPC_PORT,
            "model_path": MODEL_PATH,
            "debug": DEBUG
        }
    return {"message": "L'accès à la configuration est désactivé en mode production"}

# Point d'entrée pour exécuter l'application directement
if __name__ == "__main__":
    # Démarrer le serveur gRPC dans un thread séparé
    grpc_thread = threading.Thread(target=start_grpc_server, daemon=True)
    grpc_thread.start()
    
    # Démarrer le serveur FastAPI
    uvicorn.run("main:app", host=API_HOST, port=API_PORT, reload=DEBUG)
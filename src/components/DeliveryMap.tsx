import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker, Circle } from "@react-google-maps/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface DeliveryMapProps {
  postalCode: string;
  deliveryRadiusKm: number;
  onRadiusChange: (radius: number) => void;
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: -23.550520,
  lng: -46.633308
};

const DeliveryMap = ({ postalCode, deliveryRadiusKm, onRadiusChange }: DeliveryMapProps) => {
  const [center, setCenter] = useState(defaultCenter);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Geocode the postal code to get coordinates
    if (postalCode && postalCode.length >= 8 && apiKey) {
      geocodePostalCode(postalCode);
    }
  }, [postalCode, apiKey]);

  const geocodePostalCode = async (cep: string) => {
    setLoading(true);
    try {
      const cleanCep = cep.replace(/\D/g, '');
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${cleanCep},Brazil&key=${apiKey}`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const location = data.results[0].geometry.location;
        setCenter({
          lat: location.lat,
          lng: location.lng
        });
      }
    } catch (error) {
      console.error("Erro ao geocodificar CEP:", error);
    } finally {
      setLoading(false);
    }
  };

  const circleOptions = {
    strokeColor: "#D32F2F",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#D32F2F",
    fillOpacity: 0.15,
  };

  if (!apiKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapa de Entrega
          </CardTitle>
          <CardDescription>Configure sua chave da API do Google Maps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google-maps-key">Google Maps API Key</Label>
            <Input
              id="google-maps-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole sua chave da API aqui"
            />
            <p className="text-sm text-muted-foreground">
              Obtenha sua chave em:{" "}
              <a 
                href="https://console.cloud.google.com/google/maps-apis" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Área de Entrega
        </CardTitle>
        <CardDescription>
          Visualize a área de cobertura baseada no CEP e raio de entrega
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="radius-display">Raio de Entrega (km)</Label>
          <Input
            id="radius-display"
            type="number"
            step="0.1"
            min="0"
            value={deliveryRadiusKm}
            onChange={(e) => onRadiusChange(parseFloat(e.target.value) || 0)}
            placeholder="5.0"
          />
          <p className="text-sm text-muted-foreground">
            Ajuste o raio para visualizar a área de cobertura no mapa
          </p>
        </div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">Carregando mapa...</p>
          </div>
        ) : (
          <LoadScript 
            googleMapsApiKey={apiKey}
            onLoad={() => setIsLoaded(true)}
          >
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={13}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                <Marker 
                  position={center}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#D32F2F",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                />
                <Circle
                  center={center}
                  radius={deliveryRadiusKm * 1000}
                  options={circleOptions}
                />
              </GoogleMap>
            )}
          </LoadScript>
        )}

        {!loading && postalCode && (
          <p className="text-xs text-muted-foreground">
            Localização baseada no CEP: {postalCode}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryMap;

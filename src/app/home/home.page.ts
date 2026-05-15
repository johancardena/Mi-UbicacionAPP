import { Component, signal } from '@angular/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonIcon
} from '@ionic/angular/standalone';

import { NgIf } from '@angular/common';
import { Geolocation } from '@capacitor/geolocation';

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { environment } from '../../environments/environment';

import { createClient } from '@supabase/supabase-js';

import { addIcons } from 'ionicons';
import { location } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    NgIf
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {

  latitud = signal<number | null>(null);
  longitud = signal<number | null>(null);
  googleMaps = signal<string | null>(null);
  mensaje = signal<string | null>(null);

  firebaseApp = initializeApp(environment.firebaseConfig);
  db = getFirestore(this.firebaseApp);

  supabase = createClient(
    environment.supabaseUrl,
    environment.supabaseKey
  );

  constructor() {
    addIcons({ location });
  }

  async obtenerUbicacion() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 60000
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const link = `https://www.google.com/maps?q=${lat},${lng}`;

      await addDoc(collection(this.db, 'ubicaciones'), {
        latitud: lat,
        longitud: lng,
        googleMaps: link,
        fecha: new Date().toISOString()
      });

      const { data, error } = await this.supabase
        .from('ubicaciones')
        .insert([
          {
            latitud: lat,
            longitud: lng,
            googlemaps: link
          }
        ])
        .select();

      if (error) {
        console.error('Error Supabase:', error);
        this.mensaje.set('Firebase guardado, pero Supabase falló: ' + error.message);
      } else {
        console.log('Guardado en Supabase:', data);
        this.mensaje.set('Ubicación guardada correctamente.');
        setTimeout(() => {
        this.mensaje.set(null);
        }, 3000);
      }

      this.latitud.set(lat);
      this.longitud.set(lng);
      this.googleMaps.set(link);

    } catch (error: any) {
      console.error('Error general:', error);
      this.mensaje.set(error?.message ?? 'Error al obtener ubicación.');
    }
  }

  abrirGoogleMaps() {
    if (this.googleMaps()) {
      window.open(this.googleMaps()!, '_blank');
    }
  }
}
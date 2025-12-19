import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazkafh.kasonline',
  appName: 'Kas Mazkafh',
  webDir: 'dist',
  server: {
    // GANTI dengan link hasil firebase deploy lo
    url: 'https://kas-pekerja-gw.web.app', 
    cleartext: true
  }
};

export default config;
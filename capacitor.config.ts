import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mazkafh.kaspekerja',
  appName: 'Kas Pekerja RASI',
  webDir: 'dist',
  server: {
    url: 'https://kas-pekerja-gw.web.app/', // Masukkan domain kamu di sini
    cleartext: true
  }
};

export default config;
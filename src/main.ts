import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import packageJson from '../package.json';

if (packageJson?.version) {
  console.info('AAI Portal build version:', packageJson.version);
}

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);

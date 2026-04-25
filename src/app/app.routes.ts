import { Routes } from '@angular/router';
import { Recorder } from './recorder/recorder';

export const routes: Routes = [
  {
    path: 'recorder',
    component: Recorder,
    // loadChildren: () => import('./recorder/recorder').then((c) => c.Recorder),
  },
  {
    path: '**',
    redirectTo: 'recorder',
  },
];

import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('screen-recorder');

  public minimize() {
    (window as any).electronAPI.minimize();
  }

  public close() {
    (window as any).electronAPI.close();
  }
}

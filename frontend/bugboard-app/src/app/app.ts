import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BugWidget } from './features/widget/bug-widget/bug-widget';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BugWidget],
  template: `
    <router-outlet />
    <app-bug-widget />
  `,
  styleUrl: './app.scss'
})
export class App {
}

import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <span>🐛</span>
          <span>BUG BOARD</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
            <span class="emoji">📊</span>
            Dashboard
          </a>
          <a routerLink="/report" routerLinkActive="active">
            <span class="emoji">🐛</span>
            Report Bug
          </a>
          <a routerLink="/metrics" routerLinkActive="active">
            <span class="emoji">📈</span>
            Metrics
          </a>
        </nav>

        <div class="sidebar-spacer"></div>

        <div class="sidebar-profile">
          <div class="sidebar-avatar">
            <span>AF</span>
          </div>
          <div class="sidebar-profile-info">
            <span class="sidebar-profile-name">Anderson Frias</span>
            <span class="sidebar-profile-email">anderson&#64;bugboard.dev</span>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `
})
export class App {
}

import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // We hide the sidebar on the login page, since a logged-out
  // visitor shouldn't see navigation to protected pages.
  showShell = false;

  constructor(public auth: AuthService, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.showShell = event.urlAfterRedirects !== '/login';
      }
    });
  }

  get currentUserName(): string {
    return this.auth.getUser()?.fullName || 'User';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

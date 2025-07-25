import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { filter, map } from 'rxjs/operators';

interface BrandingConfig {
  title?: string;
  favicon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class BrandingService {
  private title = inject(Title);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private document = inject(DOCUMENT);

  private defaultTitle = 'AAI Portal';
  private defaultFavicon: string | null = null;

  init() {
    // Store default favicon
    this.defaultFavicon =
      this.document.querySelector("link[rel*='icon']")?.getAttribute('href') ||
      null;

    // Listen to route changes
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.getRouteData()),
      )
      .subscribe((data) => this.applyBranding(data));
  }

  private getRouteData(): BrandingConfig {
    let route = this.activatedRoute;
    let data: BrandingConfig = {};

    // Traverse route tree to collect data
    while (route) {
      if (route.snapshot.data) {
        data = { ...data, ...route.snapshot.data };
      }
      route = route.firstChild!;
    }

    return data;
  }

  private applyBranding(config: BrandingConfig) {
    // Set title
    if (config.title) {
      this.title.setTitle(config.title);
    } else {
      this.title.setTitle(this.defaultTitle);
    }

    // Set favicon if specified, otherwise restore default
    if (config.favicon) {
      this.setFavicon(config.favicon);
    } else {
      this.restoreDefaultFavicon();
    }
  }

  private setFavicon(href: string): void {
    const links = this.document.querySelectorAll("link[rel*='icon']");
    links.forEach((link) => link.setAttribute('href', href));
  }

  private restoreDefaultFavicon(): void {
    if (this.defaultFavicon) {
      this.setFavicon(this.defaultFavicon);
    }
  }

  // Method for manual title updates
  setTitle(title: string): void {
    this.title.setTitle(title);
  }
}

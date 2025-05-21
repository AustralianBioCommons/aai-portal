import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-bpa-registration-success',
  templateUrl: './bpa-registration-success.component.html',
})
export class BpaRegistrationSuccessComponent implements OnInit, OnDestroy {
  private titleService = inject(Title);
  private document = inject(DOCUMENT);
  private defaultFavicon: string | null = null;

  constructor() {
    this.titleService.setTitle('Registration Successful | BPA Data Portal');
  }

  ngOnInit(): void {
    this.defaultFavicon =
      this.document.querySelector("link[rel*='icon']")?.getAttribute('href') ||
      null;
    this.setFavicon('/assets/bpa-favicon.ico');
  }

  ngOnDestroy(): void {
    if (this.defaultFavicon) {
      this.setFavicon(this.defaultFavicon);
    }
  }

  private setFavicon(href: string): void {
    const links = this.document.querySelectorAll("link[rel*='icon']");
    links.forEach((link) => link.setAttribute('href', href));
  }
}

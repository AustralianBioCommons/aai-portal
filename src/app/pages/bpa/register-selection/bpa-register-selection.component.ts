import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-register-selection',
  imports: [RouterLink],
  templateUrl: './bpa-register-selection.component.html',
  styleUrls: ['./bpa-register-selection.component.css'],
})
export class BpaRegisterSelectionComponent {
  private document = inject(DOCUMENT);
  private defaultFavicon: string | null = null;

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

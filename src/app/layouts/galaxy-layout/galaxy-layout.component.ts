import { Component, Inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-galaxy-layout',
  imports: [RouterOutlet],
  templateUrl: './galaxy-layout.component.html',
  styleUrl: './galaxy-layout.component.css',
})
export class GalaxyLayoutComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  // Set Galaxy favicon for all Galaxy pages
  ngOnInit() {
    const existingLink = this.document.querySelector("link[rel*='icon']");
    if (existingLink) {
      this.document.head.removeChild(existingLink);
    }

    const favicon = this.document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = 'assets/galaxy-favicon.ico';

    this.document.head.appendChild(favicon);
  }
}

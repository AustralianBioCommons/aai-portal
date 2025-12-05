import { Component, input } from '@angular/core';
import { heroInformationCircleSolid } from '@ng-icons/heroicons/solid';
import { NgIcon, provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-tooltip',
  imports: [NgIcon],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.css',
  viewProviders: [provideIcons({ heroInformationCircleSolid })],
})
export class TooltipComponent {
  message = input.required<string>();
}

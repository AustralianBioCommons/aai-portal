import {
  Component,
  ContentChild,
  TemplateRef,
  input,
  output,
  effect,
  ElementRef,
  Renderer2,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dropdown-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dropdown-menu.component.html',
  styleUrl: './dropdown-menu.component.css',
})
export class DropdownMenuComponent {
  isOpen = input<boolean>(false);
  isOpenChange = output<boolean>();

  @ContentChild('trigger', { read: TemplateRef })
  triggerTemplate: TemplateRef<unknown> | null = null;

  @ContentChild('menu', { read: TemplateRef })
  menuTemplate: TemplateRef<unknown> | null = null;

  private elementRef = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  constructor() {
    effect((onCleanup) => {
      if (!this.isOpen()) return;

      const remove = this.renderer.listen(
        'document',
        'pointerdown',
        (event: Event) => {
          const target = event.target as HTMLElement | null;
          if (!target) return;

          if (!this.elementRef.nativeElement.contains(target)) {
            this.close();
          }
        },
        { capture: true },
      );

      onCleanup(remove);
    });
  }

  toggle() {
    this.isOpenChange.emit(!this.isOpen());
  }

  close() {
    if (this.isOpen()) this.isOpenChange.emit(false);
  }
}

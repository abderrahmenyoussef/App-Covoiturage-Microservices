import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}

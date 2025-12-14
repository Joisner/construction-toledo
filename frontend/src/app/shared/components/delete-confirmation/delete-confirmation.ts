import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-delete-confirmation',
  imports: [],
  templateUrl: './delete-confirmation.html',
  styleUrl: './delete-confirmation.css',
})
export class DeleteConfirmation {
  @Input() isOpen = false;
  @Input() title = '¿Confirmar eliminación?';
  @Input() message = 'Esta acción no se puede deshacer.';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

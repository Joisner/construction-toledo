import { Component, signal } from '@angular/core';
import { IAdmin } from '../../../../core/models/admin';
import { DeleteConfirmation } from "../../../shared/components/delete-confirmation/delete-confirmation";
import { AdminModal } from '../admin-modal/admin-modal';
import { Users } from '../../../../core/services/users';

@Component({
  selector: 'app-admins-list',
  imports: [DeleteConfirmation, AdminModal],
  templateUrl: './admins-list.html',
  styleUrl: './admins-list.css',
})
export class AdminsList {
  admins = signal<IAdmin[]>([])

  showModal = signal(false);
  showDeleteModal = signal(false);
  selectedAdmin = signal<IAdmin | null>(null);
  adminToDelete = signal<IAdmin | null>(null);
  saving = signal(false);
   constructor(private userService: Users){
    this.loadUsers();
   }

   loadUsers(){
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.admins.set(users) 
      },
      error: (err) => {}
    })
   }
  getActiveCount(): number {
    return this.admins().filter(a => a.is_active).length;
  }

  getAdminCount(): number {
    return this.admins().filter(a => a.is_admin).length;
  }

  getInitials(username: string): string {
    return username
      .split(/[\s._-]/)
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  openCreateModal() {
    this.selectedAdmin.set({
      username: '',
      email: '',
      password: '',
      is_admin: false,
      is_active: true
    });
    this.showModal.set(true);
  }

  openEditModal(admin: IAdmin) {
    this.selectedAdmin.set({ ...admin, password: '' });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedAdmin.set(null);
  }

  saveAdmin(admin: IAdmin) {
    // Prevent duplicate submissions
    if (this.saving()) return;
    this.saving.set(true);

    // Prepare body: don't send id for creation; remove empty password for updates
    const body: Partial<IAdmin> = { ...admin };
    if (!body.id) delete (body as any).id;
    if (body.id && !body.password) delete (body as any).password;

    if (admin.id) {
      // Update existing via API
      this.userService.updateUser(String(admin.id), body).subscribe({
        next: (updated) => {
          // Replace with server response to keep server-side fields
          this.admins.update(list => list.map(a => String(a.id) === String(updated.id) ? updated : a));
          this.saving.set(false);
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update admin', err);
          this.saving.set(false);
        }
      });
    } else {
      // Create via API
      // Ensure we don't send id
      if ((body as any).id) delete (body as any).id;
      this.userService.createUser(body).subscribe({
        next: (created) => {
          this.admins.update(list => [...list, created]);
          this.saving.set(false);
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to create admin', err);
          this.saving.set(false);
        }
      });
    }
  }

  openDeleteConfirm(admin: IAdmin) {
    this.adminToDelete.set(admin);
    this.showDeleteModal.set(true);
  }

  closeDeleteConfirm() {
    this.showDeleteModal.set(false);
    this.adminToDelete.set(null);
  }

  deleteAdmin() {
    const admin = this.adminToDelete();
    if (admin?.id && admin.id !== 1) {
      this.admins.update(list => list.filter(a => a.id !== admin.id));
    }
    this.closeDeleteConfirm();
  }
}
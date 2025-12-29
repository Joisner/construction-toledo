export interface IAdmin {
  id?: number;
  username: string;
  email: string;
  hashed_password?: string;
  password?: string; // Solo para crear/editar
  is_admin: boolean;
  is_active: boolean;
}